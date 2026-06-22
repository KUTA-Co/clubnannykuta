import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  Shield,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Star,
  Heart,
  DollarSign,
  Award,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";

export function NannyProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Mock data - would come from API
  const nanny = {
    id: id || "1",
    name: "Sarah Martinez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 87,
    hourlyRate: 25,
    location: "Manhattan, NY",
    yearsExperience: 8,
    verified: true,
    available: true,
    responseTime: "Within 1 hour",
    bio: "Hi! I'm Sarah, a passionate and experienced nanny with 8 years of childcare expertise. I specialize in infant care and early childhood development. I believe in creating nurturing, safe, and stimulating environments where children can thrive. I'm CPR certified, have a background in early childhood education, and I'm bilingual in English and Spanish. I love being outdoors, reading, and doing arts and crafts with the kids!",
    skills: [
      "Infant Care",
      "CPR Certified",
      "First Aid",
      "Bilingual (English/Spanish)",
      "Montessori Approach",
      "Special Needs Care",
      "Cooking",
      "Homework Help"
    ],
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      times: "9:00 AM - 6:00 PM"
    },
    ageGroups: ["Infants (0-12 months)", "Toddlers (1-3 years)", "Preschool (3-5 years)"],
    certifications: [
      "CPR Certified (2024)",
      "First Aid Certified (2024)",
      "Early Childhood Education Degree",
      "Background Check Verified"
    ],
    reviews: [
      {
        id: "1",
        author: "Rachel Thompson",
        date: "2 weeks ago",
        rating: 5,
        text: "Sarah has been absolutely wonderful with our twins! She's patient, caring, and always comes up with creative activities. Highly recommend!"
      },
      {
        id: "2",
        author: "Michael Chen",
        date: "1 month ago",
        rating: 5,
        text: "Our daughter adores Sarah! She's professional, punctual, and goes above and beyond. We're so grateful to have found her."
      },
      {
        id: "3",
        author: "Jennifer Lopez",
        date: "2 months ago",
        rating: 5,
        text: "Sarah is amazing! She helped with potty training and our son made so much progress. Communication is excellent and she truly cares."
      }
    ]
  };

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteNannies') || '[]');
    setIsFavorited(favorites.includes(nanny.id));
  }, [nanny.id]);

  const handleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteNannies') || '[]');
    if (isFavorited) {
      const updated = favorites.filter((favId: string) => favId !== nanny.id);
      localStorage.setItem('favoriteNannies', JSON.stringify(updated));
      setIsFavorited(false);
    } else {
      favorites.push(nanny.id);
      localStorage.setItem('favoriteNannies', JSON.stringify(favorites));
      setIsFavorited(true);
    }
  };

  const handleSubmitReview = () => {
    setShowReviewDialog(false);
    setReviewText("");
    setReviewRating(5);
  };

  const handleBook = () => {
    navigate(`/book/${nanny.id}`);
  };

  const handleMessage = () => {
    navigate(`/chat/${nanny.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Back Button and Page Title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="hover:bg-[#F5F2EB]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">Nanny Profile</h1>
          <p className="text-[#4A4A4A]/60 font-body text-sm">View detailed profile information</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-start">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                <AvatarImage src={nanny.image} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-[#8BA99E] text-[#4A4A4A]">
                  {nanny.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {nanny.verified && (
                <div className="absolute -bottom-1 -right-1 bg-[#8BA99E] rounded-full p-1.5 shadow-md">
                  <Shield className="h-4 w-4 text-[#4A4A4A]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold font-heading text-[#4A4A4A]">
                    {nanny.name}
                  </h2>
                  {nanny.verified && (
                    <Badge className="bg-[#8BA99E] text-[#4A4A4A] font-body text-xs px-2.5 py-0.5 rounded-full font-normal">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {nanny.available && (
                    <Badge className="bg-green-100 text-green-700 font-body text-xs px-2.5 py-0.5 rounded-full font-normal">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[#4A4A4A]/60 mb-3 font-body text-sm">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{nanny.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    <span>{nanny.yearsExperience} years exp.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Responds {nanny.responseTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Rating rating={nanny.rating} size="sm" />
                  <span className="text-sm font-semibold text-[#4A4A4A] font-body">
                    {nanny.rating}
                  </span>
                  <span className="text-[#4A4A4A]/60 font-body text-sm">
                    ({nanny.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="text-center p-3 rounded-xl bg-[#F5F2EB] border border-[#E8E5DF]">
                <div className="text-2xl font-bold font-heading flex items-center justify-center gap-1 text-[#4A4A4A]">
                  <DollarSign className="h-5 w-5" />
                  {nanny.hourlyRate}
                </div>
                <div className="text-xs text-[#4A4A4A]/60 mt-0.5 font-body">per hour</div>
              </div>

              <Button
                size="sm"
                className="w-full bg-[#8BA99E] text-[#4A4A4A] hover:bg-[#8BA99E]/90 font-body h-9 rounded-full font-normal"
                onClick={handleBook}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Book Now
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#E8E5DF] text-[#4A4A4A] hover:bg-[#F5F2EB] font-body h-9 rounded-full font-normal"
                onClick={handleMessage}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Message
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 hover:bg-[#F5F2EB] font-body rounded-full font-normal"
                onClick={handleFavorite}
              >
                <Heart
                  className={`h-3.5 w-3.5 mr-1.5 transition-all ${
                    isFavorited ? 'fill-[#4A4A4A] text-[#4A4A4A]' : 'text-[#4A4A4A]/40'
                  }`}
                />
                <span className="text-[#4A4A4A] text-sm">
                  {isFavorited ? 'Saved' : 'Save'}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* About */}
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#4A4A4A]/70 leading-relaxed font-body text-sm">{nanny.bio}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {nanny.skills.map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-[#F5F2EB] text-[#4A4A4A] font-body text-xs px-3 py-1 rounded-full font-normal border border-[#E8E5DF]"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {nanny.certifications.map((cert) => (
                  <div
                    key={cert}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F5F2EB] border border-[#E8E5DF]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                    <span className="text-[#4A4A4A] font-body text-xs">{cert}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                  Reviews ({nanny.reviewCount})
                </CardTitle>
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E8E5DF] font-body rounded-full font-normal h-7 text-xs"
                    >
                      Write Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-[#E8E5DF] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold font-heading text-[#4A4A4A]">
                        Write a Review
                      </DialogTitle>
                      <DialogDescription className="text-[#4A4A4A]/60 font-body">
                        Share your experience with {nanny.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-[#4A4A4A] font-body">
                          Rating
                        </Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  star <= reviewRating
                                    ? 'fill-[#4A4A4A] text-[#4A4A4A]'
                                    : 'text-[#E8E5DF]'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="review-text" className="text-sm font-semibold mb-2 block text-[#4A4A4A] font-body">
                          Your Review
                        </Label>
                        <Textarea
                          id="review-text"
                          placeholder="Share your experience..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="rounded-lg border-[#E8E5DF] focus:border-[#8BA99E] focus:ring-[#8BA99E]/20 font-body text-sm"
                          rows={4}
                        />
                      </div>
                      <Button
                        className="w-full bg-[#8BA99E] text-[#4A4A4A] hover:bg-[#8BA99E]/90 font-body h-9 rounded-full font-normal text-sm"
                        onClick={handleSubmitReview}
                      >
                        Submit Review
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nanny.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 rounded-lg bg-[#F5F2EB] border border-[#E8E5DF]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-[#4A4A4A] font-body text-sm">
                          {review.author}
                        </p>
                        <p className="text-xs text-[#4A4A4A]/60 font-body">{review.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }, (_, i) => (
                          <Star key={i} className="h-3 w-3 fill-[#4A4A4A] text-[#4A4A4A]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#4A4A4A]/70 leading-relaxed font-body text-xs">{review.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Availability */}
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#4A4A4A]/60 mb-2 font-semibold font-body">Available Days</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nanny.availability.days.map((day) => (
                      <Badge
                        key={day}
                        className="bg-green-100 text-green-700 font-body text-xs px-2 py-0.5 rounded-full font-normal"
                      >
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#4A4A4A]/60 mb-1 font-semibold font-body">Hours</p>
                  <p className="font-semibold text-[#4A4A4A] font-body text-sm">
                    {nanny.availability.times}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Age Groups */}
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                Experience with Ages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {nanny.ageGroups.map((age) => (
                  <div
                    key={age}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#F5F2EB]"
                  >
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-600" />
                    <span className="text-xs text-[#4A4A4A] font-body">{age}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Safety */}
          <Card className="border border-[#E8E5DF] bg-[#8BA99E] shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                Safety & Trust
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-body">Identity verified</span>
                </div>
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-body">Background check completed</span>
                </div>
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-body">References verified</span>
                </div>
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-body">CPR & First Aid certified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
