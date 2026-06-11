"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

interface Banner {
  id: number
  title: string
  description: string | null
  imageUrl: string
  linkUrl: string | null
  order: number
  active: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

interface BannerSliderProps {
  banners: Banner[]
}

export function BannerSlider({ banners }: BannerSliderProps) {
const { user } = useAuth()
const [emblaRef, emblaApi] = useEmblaCarousel(

    { loop: true, align: "center" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on("select", onSelect)
    onSelect()

    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  if (!banners || banners.length === 0) {
    return null
  }

  // Filter active banners and check date ranges
  const activeBanners = banners.filter(banner => {
    if (!banner.active) return false

    const now = new Date()
    
    if (banner.startDate) {
      const start = new Date(banner.startDate)
      if (now < start) return false
    }
    
    if (banner.endDate) {
      const end = new Date(banner.endDate)
      if (now > end) return false
    }
    
    return true
  })

  if (activeBanners.length === 0) {
    return null
  }

return (
<div className="relative w-full group">
{/* Edit Button for Admins */}
{(user?.role === 'admin_geral' || user?.role === 'admin_sede' || user?.hasGeneralAccess) && (
<Link 
href="/dashboard/banners" 
className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
>
<Button size="sm" className="bg-amber-600/90 hover:bg-amber-600 backdrop-blur-sm gap-2">
<Pencil size={14} />
Gerenciar Banners
</Button>
  </Link>
)}
<div className="overflow-hidden rounded-2xl" ref={emblaRef}>


        <div className="flex">
          {activeBanners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0">
              <div className="relative h-[300px] md:h-[400px] lg:h-[450px] w-full">
                {banner.linkUrl ? (
                  <Link href={banner.linkUrl} className="block w-full h-full">
                    <BannerContent banner={banner} />
                  </Link>
                ) : (
                  <BannerContent banner={banner} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {activeBanners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={scrollNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === selectedIndex
                    ? "bg-amber-500 w-8"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BannerContent({ banner }: { banner: Banner }) {
  return (
    <div className="relative w-full h-full group/banner">
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        className="object-cover transition-transform duration-500 group-hover/banner:scale-105"
        priority
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 drop-shadow-lg">
          {banner.title}
        </h2>
        {banner.description && (
          <p className="text-sm md:text-base lg:text-lg text-white/90 max-w-2xl drop-shadow-lg line-clamp-2">
            {banner.description}
          </p>
        )}
      </div>
    </div>
  )
}
