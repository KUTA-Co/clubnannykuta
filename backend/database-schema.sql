-- Club Nanny Database Schema
-- Run this script in SQL Server Management Studio (SSMS)
-- Make sure you're connected to the cn_dev_db database

USE cn_dev_db;
GO

-- Drop existing tables (in reverse order of dependencies)
IF OBJECT_ID('reports', 'U') IS NOT NULL DROP TABLE reports;
IF OBJECT_ID('identity_verifications', 'U') IS NOT NULL DROP TABLE identity_verifications;
IF OBJECT_ID('references', 'U') IS NOT NULL DROP TABLE references;
IF OBJECT_ID('favorites', 'U') IS NOT NULL DROP TABLE favorites;
IF OBJECT_ID('subscriptions', 'U') IS NOT NULL DROP TABLE subscriptions;
IF OBJECT_ID('payment_methods', 'U') IS NOT NULL DROP TABLE payment_methods;
IF OBJECT_ID('payments', 'U') IS NOT NULL DROP TABLE payments;
IF OBJECT_ID('messages', 'U') IS NOT NULL DROP TABLE messages;
IF OBJECT_ID('conversations', 'U') IS NOT NULL DROP TABLE conversations;
IF OBJECT_ID('reviews', 'U') IS NOT NULL DROP TABLE reviews;
IF OBJECT_ID('bookings', 'U') IS NOT NULL DROP TABLE bookings;
IF OBJECT_ID('nanny_availability', 'U') IS NOT NULL DROP TABLE nanny_availability;
IF OBJECT_ID('children', 'U') IS NOT NULL DROP TABLE children;
IF OBJECT_ID('nanny_certifications', 'U') IS NOT NULL DROP TABLE nanny_certifications;
IF OBJECT_ID('nannies', 'U') IS NOT NULL DROP TABLE nannies;
IF OBJECT_ID('families', 'U') IS NOT NULL DROP TABLE families;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
GO

-- 1. Users Table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    userType VARCHAR(20) NOT NULL CHECK (userType IN ('family', 'nanny')),
    firstName NVARCHAR(255) NOT NULL,
    lastName NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NULL,
    dateJoined DATETIME2 DEFAULT GETDATE(),
    livelinessCheckComplete BIT DEFAULT 0,
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 2. Families Table
CREATE TABLE families (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    userId CHAR(36) NOT NULL UNIQUE,
    address NVARCHAR(500) NULL,
    suburb NVARCHAR(255) NULL,
    city NVARCHAR(255) NULL,
    state NVARCHAR(255) NULL,
    zip NVARCHAR(20) NULL,
    numberOfChildren INT DEFAULT 0,
    childrenAges NVARCHAR(MAX) NULL,
    allergies NVARCHAR(MAX) NULL,
    hasPets BIT DEFAULT 0,
    emergencyContact NVARCHAR(50) NULL,
    preferredLanguages NVARCHAR(MAX) NULL,
    preferredGender VARCHAR(20) DEFAULT 'no-preference' CHECK (preferredGender IN ('male', 'female', 'no-preference')),
    nannyType NVARCHAR(MAX) NULL,
    subscriptionPlan VARCHAR(20) DEFAULT 'basic' CHECK (subscriptionPlan IN ('basic', 'premium')),
    subscriptionStartDate DATE NULL,
    subscriptionEndDate DATE NULL,
    allParentsUSCitizens BIT NULL,
    allParentsFluentEnglish BIT NULL,
    hasPrivateBedroom BIT NULL,
    householdMemberConvicted BIT NULL,
    crimeExplanation NVARCHAR(MAX) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 3. Nannies Table
CREATE TABLE nannies (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    userId CHAR(36) NOT NULL UNIQUE,
    dateOfBirth DATE NULL,
    gender VARCHAR(10) NULL CHECK (gender IN ('male', 'female')),
    country CHAR(2) NULL,
    profilePhoto NVARCHAR(500) NULL,
    bio NVARCHAR(MAX) NULL,
    headline NVARCHAR(500) NULL,
    yearsExperience INT DEFAULT 0,
    ageGroups NVARCHAR(MAX) NULL,
    skills NVARCHAR(MAX) NULL,
    hasDriving VARCHAR(10) DEFAULT 'no' CHECK (hasDriving IN ('yes', 'no', 'working')),
    educationLevel NVARCHAR(255) NULL,
    hasFamily BIT NULL,
    hasChildren BIT NULL,
    isMarried BIT NULL,
    hasGreenCard BIT NULL,
    availability NVARCHAR(MAX) NULL,
    hourlyRate DECIMAL(10,2) NULL,
    languages NVARCHAR(MAX) NULL,
    preferredAreas NVARCHAR(MAX) NULL,
    linkedIn NVARCHAR(500) NULL,
    facebook NVARCHAR(500) NULL,
    instagram NVARCHAR(500) NULL,
    subscriptionPlan VARCHAR(20) DEFAULT 'basic' CHECK (subscriptionPlan IN ('basic', 'premium')),
    recommendedBadge BIT DEFAULT 0,
    bookingStatus VARCHAR(20) DEFAULT 'available' CHECK (bookingStatus IN ('available', 'booked')),
    verified BIT DEFAULT 0,
    averageRating DECIMAL(3,2) DEFAULT 0.00,
    reviewCount INT DEFAULT 0,
    responseTime NVARCHAR(100) DEFAULT 'Within 24 hours',
    registrationFeePaid BIT DEFAULT 0,
    registrationFeeAmount DECIMAL(10,2) NULL,
    registrationFeeCurrency CHAR(3) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 4. Nanny Certifications Table
CREATE TABLE nanny_certifications (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    nannyId CHAR(36) NOT NULL,
    idUploaded BIT DEFAULT 0,
    backgroundCheck BIT DEFAULT 0,
    firstAidCert BIT DEFAULT 0,
    childcareQualification BIT DEFAULT 0,
    driverLicense BIT DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (nannyId) REFERENCES nannies(id) ON DELETE CASCADE
);
GO

-- 5. Nanny Availability Schedule Table
CREATE TABLE nanny_availability (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    nannyId CHAR(36) NOT NULL,
    dayOfWeek VARCHAR(20) NOT NULL CHECK (dayOfWeek IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    isAvailable BIT DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (nannyId) REFERENCES nannies(id) ON DELETE CASCADE
);
GO

-- 6. Children Table
CREATE TABLE children (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    familyId CHAR(36) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    age INT NULL,
    dateOfBirth DATE NULL,
    specialNeeds NVARCHAR(MAX) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE
);
GO

-- 7. Bookings Table
CREATE TABLE bookings (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    familyId CHAR(36) NOT NULL,
    nannyId CHAR(36) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    bookingType VARCHAR(20) DEFAULT 'short-term' CHECK (bookingType IN ('short-term', 'long-term')),
    contractDuration VARCHAR(20) NULL CHECK (contractDuration IN ('3-months', '6-months', '1-year', 'ongoing')),
    numberOfChildren INT DEFAULT 1,
    childrenIds NVARCHAR(MAX) NULL,
    address NVARCHAR(500) NULL,
    hourlyRate DECIMAL(10,2) NOT NULL,
    numberOfHours DECIMAL(10,2) NULL,
    totalCost DECIMAL(10,2) NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    paymentStatus VARCHAR(20) DEFAULT 'unpaid' CHECK (paymentStatus IN ('unpaid', 'paid', 'refunded')),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (familyId) REFERENCES families(id),
    FOREIGN KEY (nannyId) REFERENCES nannies(id)
);
GO

-- 8. Reviews Table
CREATE TABLE reviews (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    bookingId CHAR(36) NOT NULL,
    authorId CHAR(36) NOT NULL,
    targetId CHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text NVARCHAR(MAX) NULL,
    date DATETIME2 DEFAULT GETDATE(),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (bookingId) REFERENCES bookings(id),
    FOREIGN KEY (authorId) REFERENCES users(id),
    FOREIGN KEY (targetId) REFERENCES users(id)
);
GO

-- 9. Conversations Table
CREATE TABLE conversations (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    familyId CHAR(36) NOT NULL,
    nannyId CHAR(36) NOT NULL,
    lastMessage NVARCHAR(MAX) NULL,
    lastMessageTime DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (familyId) REFERENCES families(id),
    FOREIGN KEY (nannyId) REFERENCES nannies(id),
    CONSTRAINT UQ_Conversation UNIQUE (familyId, nannyId)
);
GO

-- 10. Messages Table
CREATE TABLE messages (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    conversationId CHAR(36) NOT NULL,
    senderId CHAR(36) NOT NULL,
    text NVARCHAR(MAX) NOT NULL,
    timestamp DATETIME2 DEFAULT GETDATE(),
    isRead BIT DEFAULT 0,
    readAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id)
);
GO

-- 11. Payments Table
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    bookingId CHAR(36) NULL,
    familyId CHAR(36) NOT NULL,
    nannyId CHAR(36) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paymentMethod NVARCHAR(255) NULL,
    transactionId NVARCHAR(255) NULL,
    completedAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (bookingId) REFERENCES bookings(id),
    FOREIGN KEY (familyId) REFERENCES families(id),
    FOREIGN KEY (nannyId) REFERENCES nannies(id)
);
GO

-- 12. Payment Methods Table
CREATE TABLE payment_methods (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    userId CHAR(36) NOT NULL,
    cardName NVARCHAR(255) NOT NULL,
    cardLast4 CHAR(4) NOT NULL,
    expiryDate CHAR(5) NOT NULL,
    isDefault BIT DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 13. Subscriptions Table
CREATE TABLE subscriptions (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    userId CHAR(36) NOT NULL,
    userType VARCHAR(20) NOT NULL CHECK (userType IN ('family', 'nanny')),
    plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'premium')),
    monthlyCost DECIMAL(10,2) NOT NULL,
    startDate DATETIME2 NOT NULL,
    endDate DATETIME2 NULL,
    autoRenew BIT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 14. Favorites Table
CREATE TABLE favorites (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    familyId CHAR(36) NOT NULL,
    nannyId CHAR(36) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (nannyId) REFERENCES nannies(id) ON DELETE CASCADE,
    CONSTRAINT UQ_Favorite UNIQUE (familyId, nannyId)
);
GO

-- 15. References Table
CREATE TABLE references (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    nannyId CHAR(36) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    relationship NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NULL,
    email NVARCHAR(255) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (nannyId) REFERENCES nannies(id) ON DELETE CASCADE
);
GO

-- 16. Identity Verifications Table
CREATE TABLE identity_verifications (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    userId CHAR(36) NOT NULL,
    userType VARCHAR(20) NOT NULL CHECK (userType IN ('family', 'nanny')),
    personaInquiryId NVARCHAR(255) NULL,
    personaReferenceId NVARCHAR(255) NULL,
    verificationStatus VARCHAR(20) DEFAULT 'pending' CHECK (verificationStatus IN ('pending', 'approved', 'rejected', 'expired')),
    verificationData NVARCHAR(MAX) NULL,
    completedAt DATETIME2 NULL,
    expiresAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 17. Reports Table
CREATE TABLE reports (
    id CHAR(36) PRIMARY KEY DEFAULT NEWID(),
    reporterId CHAR(36) NOT NULL,
    reportedUserId CHAR(36) NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    resolvedAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (reporterId) REFERENCES users(id),
    FOREIGN KEY (reportedUserId) REFERENCES users(id)
);
GO

-- Create indexes for better performance
CREATE INDEX IX_families_userId ON families(userId);
CREATE INDEX IX_nannies_userId ON nannies(userId);
CREATE INDEX IX_children_familyId ON children(familyId);
CREATE INDEX IX_bookings_familyId ON bookings(familyId);
CREATE INDEX IX_bookings_nannyId ON bookings(nannyId);
CREATE INDEX IX_reviews_bookingId ON reviews(bookingId);
CREATE INDEX IX_messages_conversationId ON messages(conversationId);
CREATE INDEX IX_conversations_familyId ON conversations(familyId);
CREATE INDEX IX_conversations_nannyId ON conversations(nannyId);
GO

PRINT 'Database schema created successfully!';
PRINT 'Total tables created: 17';
GO
