"use client"

import { useState, useCallback, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  mediaUrl: string
  mediaType: "image" | "video"
  location?: string
}

interface EventSliderProps {
  events: Event[]
  onEventClick?: (event: Event) => void
}

export const EventSlider = ({ events, onEventClick }: EventSliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum evento em destaque no momento</p>
      </Card>
    )
  }

  return (
    <div className="relative group">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {events.map((event) => (
            <div key={event.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)] min-w-0">
              <Card 
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group/card h-full"
                onClick={() => onEventClick?.(event)}
              >
                {/* Media Section */}
                <div className="relative h-48 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 overflow-hidden">
                  {event.mediaType === "image" ? (
                    <Image
                      src={event.mediaUrl}
                      alt={event.title}
                      fill
                      className="object-cover group-hover/card:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <video
                      src={event.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 border-0 text-white shadow-lg">
                    Em Destaque
                  </Badge>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-xl line-clamp-2 group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors">
                    {event.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>
                        {formatTime(event.startDate)} às {formatTime(event.endDate)}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {events.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-amber-200 hover:bg-amber-50 hover:border-amber-400 shadow-lg z-10"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-amber-200 hover:bg-amber-50 hover:border-amber-400 shadow-lg z-10"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {events.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {events.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-8 bg-gradient-to-r from-amber-500 to-yellow-500"
                  : "w-2 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}