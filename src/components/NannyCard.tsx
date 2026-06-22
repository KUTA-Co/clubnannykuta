import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { MessageCircle, Heart, MapPin, Clock, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface NannyCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  experience: string;
  bio: string;
  skills: string[];
  verified: boolean;
  available: boolean;
  recommended?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  bookingStatus?: "available" | "booked";
  linkedIn?: string;
  facebook?: string;
  instagram?: string;
}

export function NannyCard({
  id,
  name,
  image,
  rating,
  reviewCount,
  hourlyRate,
  location,
  experience,
  bio,
  skills,
  verified,
  available,
  recommended,
  buttonText = "View Profile",
  onButtonClick,
  bookingStatus = "available",
  linkedIn,
  facebook,
  instagram
}: NannyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border border-[#E8E5DF] bg-white rounded-2xl">
      <div className="relative">
        <div className="w-full h-72 overflow-hidden bg-gradient-to-br from-[#8BA99E] to-[#8BA99E]/80">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 30%',
              width: '100%',
              height: '100%'
            }}
          />
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {verified && (
            <Badge className="bg-blue-500 text-white border-0 shadow-lg font-body">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {recommended && (
            <Badge className="bg-red-500 text-white border-0 shadow-lg font-body">
              ⭐ Recommended
            </Badge>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 bg-white/95 hover:bg-white rounded-full shadow-md h-9 w-9"
          onClick={() => setIsFavorited(!isFavorited)}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-[#8BA99E] text-[#8BA99E]' : 'text-[#4A4A4A]'}`} />
        </Button>
        {/* Booking Status Badge */}
        <Badge className={`absolute bottom-3 left-3 border-0 shadow-lg font-body ${
          bookingStatus === "available"
            ? "bg-green-500 text-white"
            : "bg-orange-500 text-white"
        }`}>
          {bookingStatus === "available" ? "Available Now" : "Booked"}
        </Badge>
      </div>
      
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link to={`/nanny/${id}`}>
              <h3 className="font-semibold text-lg font-heading text-[#4A4A4A] mb-1 hover:text-[#8BA99E] transition-colors">
                {name}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-[#4A4A4A]/60 font-body">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-heading text-[#4A4A4A]">
              ${hourlyRate}
            </div>
            <div className="text-xs text-[#4A4A4A]/60 font-body">per hour</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-[#4A4A4A] font-body">{rating}</span>
          </div>
          <span className="text-xs text-[#4A4A4A]/60 font-body">
            ({reviewCount} reviews)
          </span>
        </div>

        <p className="text-sm text-[#4A4A4A]/70 font-body line-clamp-2 leading-relaxed">
          {bio}
        </p>

        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]/60 font-body">
          <Clock className="h-4 w-4" />
          <span>{experience}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill) => (
            <Badge key={skill} className="text-xs px-2.5 py-1 bg-[#F5F2EB] text-[#4A4A4A] border-0 font-body rounded-full">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge className="text-xs px-2.5 py-1 bg-[#F5F2EB] text-[#4A4A4A] border-0 font-body rounded-full">
              +{skills.length - 3} more
            </Badge>
          )}
        </div>

        {/* Social Media Links */}
        {(linkedIn || facebook || instagram) && (
          <div className="flex items-center gap-3 pt-2 border-t border-[#E8E5DF]">
            <span className="text-xs text-[#4A4A4A]/60 font-body">Connect:</span>
            {linkedIn && (
              <a
                href={linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0A66C2] hover:text-[#004182] transition-colors"
                title="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1877F2] hover:text-[#145DBF] transition-colors"
                title="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E4405F] hover:text-[#C13584] transition-colors"
                title="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <Button 
            className="flex-1 font-body bg-[#8BA99E] text-[#4A4A4A] hover:bg-[#8BA99E]/90 rounded-full" 
            onClick={onButtonClick}
            asChild={!onButtonClick}
          >
            {onButtonClick ? (
              buttonText
            ) : (
              <Link to={`/nanny/${id}`}>
                {buttonText}
              </Link>
            )}
          </Button>
          <Button 
            variant="outline"
            size="icon"
            className="font-body border-[#E8E5DF] rounded-full"
            asChild
          >
            <Link to={`/chat/${id}`}>
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
