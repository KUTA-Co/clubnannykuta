const DEMO_PASSWORD = "ClubNannyTest123!";
const DEMO_REQUESTS_KEY = "club_nanny_demo_requests";

type DemoRole = "family" | "sitter";
type DemoUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: DemoRole;
};
type JsonMap = Record<string, unknown>;
type TokenPayload = {
  email?: string;
  exp?: number;
};

const demoUsers: Record<string, DemoUser> = {
  "family@test.clubnanny.com": {
    id: "demo-family-user",
    email: "family@test.clubnanny.com",
    firstName: "Taylor",
    lastName: "Family",
    role: "family",
  },
  "sitter@test.clubnanny.com": {
    id: "demo-sitter-user",
    email: "sitter@test.clubnanny.com",
    firstName: "Ava",
    lastName: "Sitter",
    role: "sitter",
  },
};

const demoSitter = {
  _id: "demo-sitter-profile",
  firstName: "Ava",
  lastName: "Sitter",
  email: "sitter@test.clubnanny.com",
  phone: "(555) 014-2000",
  age: 24,
  status: "active",
  bio: "Warm, reliable sitter with evening and weekend availability.",
  experience: "5 years of babysitting, school holiday care, and date-night sitting.",
  hourlyRate: 22,
  city: "Dallas",
  state: "TX",
  postalCode: "75205",
  preferredRadius: 15,
  profilePhoto: "",
  averageRating: 4.9,
  reviewCount: 12,
};

const demoFamily = {
  _id: "demo-family-profile",
  householdName: "The Parker Family",
  email: "family@test.clubnanny.com",
  phone: "(555) 014-1000",
  address: "123 Maple Lane",
  city: "Dallas",
  state: "TX",
  postalCode: "75205",
  status: "active",
  membershipStatus: "active",
  membershipExpiresAt: "2027-12-31T23:59:59.000Z",
  children: [
    { name: "Mia", age: 4, specialNeeds: "" },
    { name: "Noah", age: 7, specialNeeds: "Peanut allergy" },
  ],
  emergencyContact: {
    name: "Jordan Parker",
    phone: "(555) 014-1001",
    relationship: "Parent",
  },
  averageRating: 4.8,
  reviewCount: 6,
};

const weeklyAvailability = {
  monday: { available: true, start: "08:00", end: "22:00" },
  tuesday: { available: true, start: "08:00", end: "22:00" },
  wednesday: { available: true, start: "08:00", end: "22:00" },
  thursday: { available: true, start: "08:00", end: "22:00" },
  friday: { available: true, start: "08:00", end: "23:00" },
  saturday: { available: true, start: "09:00", end: "23:00" },
  sunday: { available: false, start: "08:00", end: "22:00" },
};

function shouldUseDemoApi() {
  if (import.meta.env.VITE_API_URL) return false;
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "club-nanny.vercel.app" ||
    window.location.search.includes("demoApi=1") ||
    window.localStorage.getItem("club_nanny_demo_api") === "1"
  );
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function base64Url(value: string) {
  return window
    .btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createToken(user: DemoUser) {
  const header = base64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90,
    })
  );
  return `${header}.${payload}.demo`;
}

function parseToken(token: string) {
  try {
    const payloadPart = token.split(".")[1] || "";
    const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded)) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAuthUser(headers: Headers) {
  const auth = headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = parseToken(token);
  return payload ? demoUsers[String(payload.email || "").toLowerCase()] || null : null;
}

async function readJson(init?: RequestInit): Promise<JsonMap> {
  if (!init?.body || typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function ok(body: JsonMap = {}) {
  return json({ success: true, ...body });
}

function createDefaultDemoRequests() {
  const familyId = {
    householdName: demoFamily.householdName,
    city: demoFamily.city,
    state: demoFamily.state,
    phone: demoFamily.phone,
    email: demoFamily.email,
    emergencyContact: demoFamily.emergencyContact,
  };
  const confirmedSitterId = {
    _id: demoSitter._id,
    firstName: demoSitter.firstName,
    lastName: demoSitter.lastName,
    phone: demoSitter.phone,
    email: demoSitter.email,
    profilePhoto: demoSitter.profilePhoto,
    hourlyRate: demoSitter.hourlyRate,
  };

  return [
    {
      _id: "demo-request-1",
      date: addDays(3),
      startTime: "18:00",
      endTime: "22:00",
      address: demoFamily.address,
      city: demoFamily.city,
      state: demoFamily.state,
      postalCode: demoFamily.postalCode,
      numberOfChildren: 2,
      childrenAges: [4, 7],
      notes: "Dinner will be ready. Bedtime starts at 8:15.",
      specialInstructions: "Noah has a peanut allergy.",
      status: "responses_received",
      responseCount: 1,
      familyId,
      responses: [
        {
          _id: "demo-response-1",
          status: "interested",
          message: "Happy to help with this babysitting request.",
          respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sitterId: { ...demoSitter },
          sitterReviews: [
            {
              _id: "demo-review-sitter-1",
              rating: 5,
              comment: "Calm, kind, and very dependable.",
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              familyId: { householdName: "The Morgan Family" },
            },
          ],
        },
      ],
    },
    {
      _id: "demo-request-2",
      date: addDays(8),
      startTime: "09:00",
      endTime: "12:30",
      address: "45 Oak Street",
      city: "Dallas",
      state: "TX",
      postalCode: "75205",
      numberOfChildren: 1,
      childrenAges: [3],
      notes: "Morning playtime and lunch prep.",
      specialInstructions: "",
      status: "open",
      responseCount: 0,
      familyId,
      responses: [],
    },
    {
      _id: "demo-booking-1",
      date: addDays(12),
      startTime: "17:30",
      endTime: "21:30",
      address: demoFamily.address,
      city: demoFamily.city,
      state: demoFamily.state,
      postalCode: demoFamily.postalCode,
      numberOfChildren: 2,
      childrenAges: [4, 7],
      notes: "Date-night booking. Pizza will be delivered.",
      specialInstructions: "",
      status: "confirmed",
      responseCount: 1,
      familyId,
      confirmedSitterId,
      payment: { status: "unpaid", amountCents: 8800 },
      responses: [],
    },
    {
      _id: "demo-completed-1",
      date: addDays(-10),
      startTime: "18:00",
      endTime: "21:00",
      address: demoFamily.address,
      city: demoFamily.city,
      state: demoFamily.state,
      postalCode: demoFamily.postalCode,
      numberOfChildren: 2,
      childrenAges: [4, 7],
      notes: "Completed demo booking.",
      specialInstructions: "",
      status: "completed",
      responseCount: 1,
      familyId,
      confirmedSitterId,
      payment: { status: "paid", amountCents: 6600 },
      responses: [],
    },
  ];
}

type DemoRequest = ReturnType<typeof createDefaultDemoRequests>[number] & Record<string, unknown>;

function readDemoRequests() {
  try {
    const stored = window.sessionStorage.getItem(DEMO_REQUESTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DemoRequest[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    window.sessionStorage.removeItem(DEMO_REQUESTS_KEY);
  }

  const requests = createDefaultDemoRequests();
  writeDemoRequests(requests);
  return requests;
}

function writeDemoRequests(requests: DemoRequest[]) {
  window.sessionStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(requests));
}

function demoRequests() {
  return readDemoRequests();
}

function findRequest(id: string) {
  return demoRequests().find((request) => request._id === id) || demoRequests()[0];
}

function demoSitterResponseStatus(request: DemoRequest) {
  if (request.confirmedSitterId?._id === demoSitter._id) return "selected";
  return request.responses?.find((response) => response.sitterId?._id === demoSitter._id)?.status;
}

function demoJobView(request: DemoRequest) {
  const responseStatus = demoSitterResponseStatus(request);
  const job = {
    ...request,
    familyId: request.familyId ? { ...request.familyId } : request.familyId,
    isAvailable: true,
    hasResponded: Boolean(responseStatus),
    responseStatus,
  };

  if (responseStatus !== "selected") {
    delete job.address;
    if (job.familyId) {
      delete job.familyId.phone;
      delete job.familyId.email;
      delete job.familyId.emergencyContact;
    }
  }

  return job;
}

function updateRequest(id: string, updater: (request: DemoRequest) => DemoRequest) {
  const requests = demoRequests();
  const index = requests.findIndex((request) => request._id === id);
  if (index === -1) return findRequest(id);

  requests[index] = updater(requests[index]);
  writeDemoRequests(requests);
  return requests[index];
}

function demoJobs() {
  return demoRequests()
    .filter((request) => ["open", "responses_received"].includes(request.status))
    .map((request) => demoJobView(request));
}

function demoBookings(status?: string | null) {
  const targetStatus = status === "completed" ? "completed" : "confirmed";
  return demoRequests().filter((request) => request.status === targetStatus);
}

function demoNotifications(role: string) {
  return role === "sitter"
    ? [
        {
          _id: "demo-note-sitter-1",
          type: "job",
          title: "New babysitting request nearby",
          body: "The Parker Family posted a request for this weekend.",
          link: "/sitting/sitter/jobs/demo-request-1",
          read: false,
          createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        },
      ]
    : [
        {
          _id: "demo-note-family-1",
          type: "response",
          title: "A sitter responded",
          body: "Ava Sitter is interested in your request.",
          link: "/sitting/family/requests/demo-request-1",
          read: false,
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
      ];
}

async function handleDemoApi(path: string, url: URL, method: string, headers: Headers, init?: RequestInit) {
  if (method === "POST" && path === "auth/login") {
    const body = await readJson(init);
    const email = String(body.email || "").trim().toLowerCase();
    const user = demoUsers[email];
    if (!user || body.password !== DEMO_PASSWORD) {
      return json({ success: false, message: "Invalid email or password" }, 401);
    }
    return ok({ token: createToken(user), user });
  }

  const user = getAuthUser(headers);
  if (path === "auth/me") {
    return user ? ok({ user }) : json({ success: false, message: "Not authenticated" }, 401);
  }
  if (!user) return json({ success: false, message: "Not authenticated" }, 401);

  if (path === "sitting/auth/check-profile") {
    return ok({
      authenticated: true,
      role: user.role,
      user,
      hasSitterProfile: user.role === "sitter",
      hasFamilyProfile: user.role === "family",
    });
  }

  if (path === "sitting/family/profile") return ok({ profile: demoFamily });
  if (path === "sitter/profile") return ok({ profile: demoSitter });
  if (path === "sitter/profile/photo") return ok({ profile: demoSitter });

  if (path === "sitter/availability") {
    return ok({
      availability: {
        _id: "demo-availability",
        weeklyAvailability,
        blockedSlots: [{ _id: "demo-block-1", date: addDays(5), reason: "Personal commitment", isAllDay: true }],
      },
    });
  }
  if (path.startsWith("sitter/availability/block")) return ok({ availability: { weeklyAvailability, blockedSlots: [] } });

  if (path === "sitting/family/requests") {
    if (method === "POST") {
      const body = await readJson(init);
      const newRequest = {
        _id: `demo-request-${Date.now()}`,
        date: String(body.date || addDays(2)),
        startTime: String(body.startTime || "18:00"),
        endTime: String(body.endTime || "21:00"),
        address: String(body.address || demoFamily.address),
        city: String(body.city || demoFamily.city),
        state: String(body.state || demoFamily.state),
        postalCode: String(body.postalCode || demoFamily.postalCode),
        numberOfChildren: Number(body.numberOfChildren || 1),
        childrenAges: Array.isArray(body.childrenAges) ? body.childrenAges.map(Number).filter((age) => !Number.isNaN(age)) : [],
        notes: String(body.notes || ""),
        specialInstructions: String(body.specialInstructions || ""),
        status: "open",
        responseCount: 0,
        familyId: {
          householdName: demoFamily.householdName,
          city: demoFamily.city,
          state: demoFamily.state,
          phone: demoFamily.phone,
          email: demoFamily.email,
          emergencyContact: demoFamily.emergencyContact,
        },
        responses: [],
      };
      const requests = demoRequests();
      writeDemoRequests([newRequest, ...requests]);
      return ok({ request: newRequest });
    }
    const status = url.searchParams.get("status");
    const upcoming = url.searchParams.get("upcoming") === "true";
    let requests = demoRequests();
    if (status) requests = requests.filter((request) => request.status === status);
    if (upcoming) requests = requests.filter((request) => request.status !== "completed");
    return ok({ requests });
  }

  const familyRequest = path.match(/^sitting\/family\/requests\/([^/]+)(?:\/confirm)?$/);
  if (familyRequest) {
    const requestId = familyRequest[1];
    if (method === "DELETE") {
      const request = updateRequest(requestId, (current) => ({
        ...current,
        status: "cancelled",
        responses: current.responses?.map((response) => ({ ...response, status: "not_selected" })) || [],
      }));
      return ok({ request });
    }

    if (path.endsWith("/confirm") && method === "POST") {
      const body = await readJson(init);
      const sitterId = String(body.sitterId || demoSitter._id);
      const request = updateRequest(requestId, (current) => {
        const responses = current.responses?.length
          ? current.responses.map((response) => ({
              ...response,
              status: response.sitterId?._id === sitterId ? "selected" : "not_selected",
            }))
          : [
              {
                _id: `demo-response-${Date.now()}`,
                status: "selected",
                message: "Happy to help with this babysitting request.",
                respondedAt: new Date().toISOString(),
                sitterId: { ...demoSitter },
                sitterReviews: [],
              },
            ];

        return {
          ...current,
          status: "confirmed",
          responseCount: responses.filter((response) => response.status === "selected").length,
          confirmedAt: new Date().toISOString(),
          confirmedSitterId: {
            _id: demoSitter._id,
            firstName: demoSitter.firstName,
            lastName: demoSitter.lastName,
            phone: demoSitter.phone,
            email: demoSitter.email,
            profilePhoto: demoSitter.profilePhoto,
            hourlyRate: demoSitter.hourlyRate,
          },
          payment: current.payment || { status: "unpaid", amountCents: demoSitter.hourlyRate * 400 },
          responses,
        };
      });
      return ok({ request });
    }

    return ok({ request: findRequest(requestId) });
  }

  if (path === "sitting/family/bookings") return ok({ bookings: demoBookings("confirmed") });

  const familyBooking = path.match(/^sitting\/family\/bookings\/([^/]+)(?:\/(pay|complete|review))?$/);
  if (familyBooking) {
    if (familyBooking[2] === "pay") return ok({ url: "/sitting/family/bookings?payment=success" });
    if (familyBooking[2] === "complete" && method === "POST") {
      return ok({ booking: updateRequest(familyBooking[1], (request) => ({ ...request, status: "completed" })) });
    }
    if (familyBooking[2] === "review") return ok({ review: method === "GET" ? null : { rating: 5 } });
    return ok({ booking: findRequest(familyBooking[1]) });
  }

  if (path === "sitter/jobs") return ok({ jobs: demoJobs() });

  const sitterJob = path.match(/^sitter\/jobs\/([^/]+)(?:\/respond)?$/);
  if (sitterJob) {
    const requestId = sitterJob[1];
    if (path.endsWith("/respond")) {
      const request = updateRequest(requestId, (current) => {
        const existingResponses = current.responses || [];
        let responses;

        if (method === "DELETE") {
          responses = existingResponses.map((response) =>
            response.sitterId?._id === demoSitter._id ? { ...response, status: "withdrawn", withdrawnAt: new Date().toISOString() } : response
          );
        } else {
          const hasResponse = existingResponses.some((response) => response.sitterId?._id === demoSitter._id);
          responses = hasResponse
            ? existingResponses.map((response) =>
                response.sitterId?._id === demoSitter._id
                  ? { ...response, status: "interested", respondedAt: new Date().toISOString() }
                  : response
              )
            : [
                ...existingResponses,
                {
                  _id: `demo-response-${Date.now()}`,
                  status: "interested",
                  message: "Happy to help with this babysitting request.",
                  respondedAt: new Date().toISOString(),
                  sitterId: { ...demoSitter },
                  sitterReviews: [],
                },
              ];
        }

        const interestedCount = responses.filter((response) => response.status === "interested").length;
        return {
          ...current,
          status: interestedCount > 0 ? "responses_received" : "open",
          responseCount: interestedCount,
          responses,
        };
      });

      return ok({
        response: {
          status: method === "DELETE" ? "withdrawn" : "interested",
        },
        job: demoJobView(request),
      });
    }

    const request = findRequest(requestId);
    return ok({ job: demoJobView(request) });
  }

  if (path === "sitter/bookings") return ok({ bookings: demoBookings(url.searchParams.get("status")) });

  const sitterBooking = path.match(/^sitter\/bookings\/([^/]+)(?:\/(complete|review))?$/);
  if (sitterBooking) {
    if (method === "DELETE") {
      return ok({
        booking: updateRequest(sitterBooking[1], (request) => ({
          ...request,
          status: "open",
          confirmedSitterId: undefined,
          confirmedAt: undefined,
          responseCount: 0,
          responses: request.responses?.map((response) =>
            response.sitterId?._id === demoSitter._id ? { ...response, status: "withdrawn" } : response
          ) || [],
        })),
      });
    }
    if (sitterBooking[2] === "complete" && method === "POST") {
      return ok({ booking: updateRequest(sitterBooking[1], (request) => ({ ...request, status: "completed" })) });
    }
    if (sitterBooking[2] === "review") return ok({ review: method === "GET" ? null : { rating: 5 } });
    return ok({ booking: findRequest(sitterBooking[1]) });
  }

  if (path === "notifications/unread-count") return ok({ count: demoNotifications(user.role).filter((item) => !item.read).length });
  if (path === "notifications") return ok({ notifications: demoNotifications(user.role) });
  if (path === "notifications/read-all" || /^notifications\/[^/]+\/read$/.test(path)) return ok();
  if (path === "push/subscribe" || path === "push/unsubscribe") return ok();

  return json({ success: false, message: "Demo API route not found" }, 404);
}

export function installDemoSittingApi() {
  if (!shouldUseDemoApi()) return;

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
    const url = new URL(requestUrl, window.location.origin);
    const sameOrigin = url.origin === window.location.origin;

    if (!sameOrigin || !url.pathname.startsWith("/api/")) {
      return realFetch(input, init);
    }

    const request = input instanceof Request ? input : null;
    const method = (init?.method || request?.method || "GET").toUpperCase();
    const headers = new Headers(request?.headers);
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    const path = url.pathname.replace(/^\/api\/?/, "");

    return handleDemoApi(path, url, method, headers, init);
  };
}
