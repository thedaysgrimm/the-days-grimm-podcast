import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Play, Youtube, Music, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchEpisodes, type Episode } from '../services/episodes'

const Episodes: React.FC = () => {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleEpisodeCount, setVisibleEpisodeCount] = useState<number>(4)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const data = await fetchEpisodes()
        if (isMounted) {
          setEpisodes(data)
          setLoading(false)
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to load episodes')
          setLoading(false)
        }
      }
    })()
    return () => { isMounted = false }
  }, [])

  const featuredEpisode = episodes.find(ep => ep.featured)
  const upcomingEpisodes = (episodes as any[]).filter(ep => (ep as any).isUpcoming)
  const allRecentEpisodes = episodes
    .filter((ep: any) => !ep.isUpcoming)
    .sort((a: any, b: any) => {
      const ta = typeof a.sortTimestamp === 'number' ? a.sortTimestamp : Date.parse(a.date || '') || 0
      const tb = typeof b.sortTimestamp === 'number' ? b.sortTimestamp : Date.parse(b.date || '') || 0
      return tb - ta
    })
  
  const recentEpisodes = allRecentEpisodes.slice(0, visibleEpisodeCount)

  // Auto-rotate upcoming episodes if there are 2 or more
  const [upcomingIndex, setUpcomingIndex] = useState(0)
  const upcomingScrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const isInteractingRef = useRef<boolean>(false)
  useEffect(() => {
    if (upcomingEpisodes.length > 1) {
      const id = setInterval(() => {
        // Only auto-advance when upcoming slider is in view
        const container = upcomingScrollRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const inView = rect.top < window.innerHeight && rect.bottom > 0
        if (!inView) return
        setUpcomingIndex((prev) => {
          if (isInteractingRef.current) {
            return prev
          }
          const next = (prev + 1) % upcomingEpisodes.length
          const child = container.children.item(next) as HTMLElement | null
          child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
          return next
        })
      }, 15000)
      return () => clearInterval(id)
    }
    // Reset index when count drops below 2
    setUpcomingIndex(0)
    return undefined
  }, [upcomingEpisodes.length])

  const handleUpcomingScroll = () => {
    const container = upcomingScrollRef.current
    if (!container) return
    const idx = Math.round(container.scrollLeft / container.clientWidth)
    if (idx !== upcomingIndex) setUpcomingIndex(Math.max(0, Math.min(idx, upcomingEpisodes.length - 1)))
  }

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    isInteractingRef.current = true
  }

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    touchStartXRef.current = null
    touchStartYRef.current = null
    if (startX == null || startY == null) { isInteractingRef.current = false; return }
    const endX = e.changedTouches[0]?.clientX ?? startX
    const endY = e.changedTouches[0]?.clientY ?? startY
    const dx = endX - startX
    const dy = endY - startY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const threshold = 50
    if (absDx > absDy && absDx > threshold) {
      // Horizontal swipe
      if (dx > 0) {
        // Swipe right → previous
        const prev = (upcomingIndex - 1 + upcomingEpisodes.length) % upcomingEpisodes.length
        setUpcomingIndex(prev)
        const container = upcomingScrollRef.current
        const child = container?.children.item(prev) as HTMLElement | null
        child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
      } else {
        // Swipe left → next
        const next = (upcomingIndex + 1) % upcomingEpisodes.length
        setUpcomingIndex(next)
        const container = upcomingScrollRef.current
        const child = container?.children.item(next) as HTMLElement | null
        child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
      }
    }
    isInteractingRef.current = false
  }

  return (
    <section id="episodes" className="section bg-dark" ref={sectionRef}>
      <div className="container">
        {/* Only show Upcoming section if there are upcoming episodes or still loading */}
        {(upcomingEpisodes.length > 0 || loading || error) && (
          <>
            <motion.h2
              className="text-4xl font-bold text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6 }}
            >
              Upcoming
            </motion.h2>

            {/* Loading/Error States */}
            {loading && (
              <div className="bg-dark/50 backdrop-blur-sm rounded-2xl border border-white/60 p-8 max-w-4xl mx-auto mb-16 text-center text-text-muted shadow-xl shadow-white/20">Loading…</div>
            )}
            {error && (
              <div className="bg-dark/50 backdrop-blur-sm rounded-2xl border border-white/60 p-8 max-w-4xl mx-auto mb-16 text-center text-red-400 shadow-xl shadow-white/20">{error}</div>
            )}
          </>
        )}

        {/* Upcoming Episodes Content */}
        {upcomingEpisodes.length >= 1 && !loading && !error ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-dark/50 backdrop-blur-sm rounded-2xl border border-white/60 p-8 max-w-4xl mx-auto mb-16 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/30 hover:bg-dark/60 shadow-xl shadow-white/20"
            style={{ minHeight: '540px' }}
          >
            <div
              ref={upcomingScrollRef}
              onScroll={handleUpcomingScroll}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="flex overflow-x-auto no-scrollbar scroll-smooth gap-0"
              style={{ scrollSnapType: 'x mandatory', touchAction: 'pan-y', height: '100%' }}
            >
              {upcomingEpisodes.map((ep: any) => (
                <div key={ep.id} className="w-full shrink-0 px-0" style={{ scrollSnapAlign: 'start' }}>
                  <div className="mb-4 sm:mb-6 text-center">
                    <h4 className="text-2xl sm:text-3xl font-extrabold line-clamp-2">
                      {ep.number} {ep.title}
                    </h4>
                  </div>
                  <div
                    className="w-full h-48 sm:h-64 rounded-xl mb-4 sm:mb-6 overflow-hidden bg-dark-lighter"
                    style={{
                      backgroundImage: ep.thumbnail ? `url(${ep.thumbnail})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="flex flex-wrap gap-3 sm:gap-4 text-text-muted text-sm mb-3 sm:mb-4 justify-center">
                    <span>{ep.date}</span>
                    <span>Upcoming</span>
                  </div>
                  <p className="text-text-secondary mb-5 sm:mb-6 leading-relaxed text-center line-clamp-3">
                    {ep.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
                    <a href={ep.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Notify Me
                    </a>
                    <a
                      href="https://www.youtube.com/c/TheDaysGrimm?sub_confirmation=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-gradient-to-r from-red-600 to-red-700 text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-red-600/30"
                    >
                      <Youtube size={16} />
                      Subscribe
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {/* Dots - Only show if more than 1 upcoming episode */}
            {upcomingEpisodes.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {upcomingEpisodes.map((_, idx) => (
                  <button
                    key={idx}
                    aria-label={`Go to upcoming ${idx + 1}`}
                    onClick={() => {
                      setUpcomingIndex(idx)
                      const container = upcomingScrollRef.current
                      const child = container?.children.item(idx) as HTMLElement | null
                      child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
                    }}
                    className={`w-2.5 h-2.5 rounded-full ${idx === upcomingIndex ? 'bg-primary' : 'bg-dark-lighter'}`}
                  />
                ))}
              </div>
            )}
            {/* Navigation arrows - Only show if more than 1 upcoming episode */}
            {upcomingEpisodes.length > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="btn btn-secondary px-3 py-2"
                  aria-label="Previous upcoming"
                  onClick={() => {
                    const prev = (upcomingIndex - 1 + upcomingEpisodes.length) % upcomingEpisodes.length
                    setUpcomingIndex(prev)
                    const container = upcomingScrollRef.current
                    const child = container?.children.item(prev) as HTMLElement | null
                    child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="btn btn-secondary px-3 py-2"
                  aria-label="Next upcoming"
                  onClick={() => {
                    const next = (upcomingIndex + 1) % upcomingEpisodes.length
                    setUpcomingIndex(next)
                    const container = upcomingScrollRef.current
                    const child = container?.children.item(next) as HTMLElement | null
                    child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        ) : (featuredEpisode && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-dark/50 backdrop-blur-sm rounded-2xl border border-white/60 p-8 max-w-4xl mx-auto mb-16 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/30 hover:bg-dark/60 shadow-xl shadow-white/20"
          >
            {/* Title moved above image with gradient styling */}
            <div className="mb-4 sm:mb-6 text-center ">
              <h4 className="text-2xl sm:text-3xl font-extrabold ">
                {featuredEpisode.number} {featuredEpisode.title}
              </h4>
            </div>

            <div
              className="w-full h-48 sm:h-64 rounded-xl mb-4 sm:mb-6 overflow-hidden bg-dark-lighter"
              style={{
                backgroundImage: featuredEpisode.thumbnail ? `url(${featuredEpisode.thumbnail})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            <div className="flex flex-wrap gap-3 sm:gap-4 text-text-muted text-sm mb-3 sm:mb-4">
              <span>{featuredEpisode.date}</span>
              <span>{(featuredEpisode as any).isUpcoming ? 'Upcoming' : featuredEpisode.duration}</span>
            </div>
            <p className="text-text-secondary mb-5 sm:mb-6 leading-relaxed">{featuredEpisode.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
              {(featuredEpisode as any).isUpcoming ? (
                <a href={featuredEpisode.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Notify Me
                </a>
              ) : (
                <a href={featuredEpisode.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <Play size={20} />
                  Play Episode
                </a>
              )}
              <a
                href="https://www.youtube.com/c/TheDaysGrimm?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-gradient-to-r from-red-600 to-red-700 text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-red-600/30"
              >
                <Youtube size={16} />
                Subscribe
              </a>
            </div>
          </motion.div>
        ))}
        
        {/* Recent Episodes - Testing Vercel Pro deployment */}
        <motion.h3
          className="text-3xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Recent Episodes
        </motion.h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {recentEpisodes.map((episode, index) => (
            <div
              key={episode.id || `${episode.title}-${index}`}
              className="bg-dark/50 backdrop-blur-sm rounded-2xl border border-white/60 p-6 relative overflow-hidden flex flex-col text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/30 hover:bg-dark/60 shadow-xl shadow-white/20"
            >
              {/* Episode number badge intentionally removed per request */}
              <div
                className="w-full h-40 sm:h-48 rounded-lg mb-3 sm:mb-4 flex items-center justify-center bg-dark-lighter"
                style={{
                  backgroundImage: episode.thumbnail ? `url(${episode.thumbnail})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="flex justify-between text-text-muted text-xs sm:text-sm mb-2 sm:mb-3">
                <span className="mx-auto sm:mx-0">{episode.date}</span>
                <span className="hidden sm:inline">{episode.duration}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{episode.title}</h3>
              <p className="text-text-secondary mb-3 sm:mb-4 leading-relaxed">{episode.description}</p>
              <div className="flex items-center justify-center gap-3 mt-auto">
                <a
                  href={episode.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-gradient-to-r from-red-600 to-red-700 text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-red-600/30"
                >
                  <Youtube size={16} />
                  Watch Now
                </a>
                {episode.spotifyUrl && (
                  <a
                    href={episode.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-dark-lighter rounded-full flex items-center justify-center hover:bg-primary transition-colors duration-300"
                    aria-label="Listen on Spotify"
                  >
                    <Music size={20} />
                  </a>
                )}
                {episode.applePodcastUrl && (
                  <a
                    href={episode.applePodcastUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-dark-lighter rounded-full flex items-center justify-center hover:bg-primary transition-colors duration-300"
                    aria-label="Listen on Apple Podcasts"
                  >
                    <Smartphone size={20} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        
         <div className="text-center">
           {allRecentEpisodes.length > visibleEpisodeCount && visibleEpisodeCount < 8 ? (
             <button 
               onClick={() => setVisibleEpisodeCount(8)}
               className="btn btn-outline mr-4"
             >
               See More Episodes
             </button>
           ) : null}
           
           {visibleEpisodeCount >= 8 || allRecentEpisodes.length <= visibleEpisodeCount ? (
             <a 
               href="https://www.youtube.com/c/TheDaysGrimm" 
               target="_blank" 
               rel="noopener noreferrer"
               className="btn btn-outline"
             >
               Visit Our YouTube Channel
             </a>
           ) : null}
         </div>
      </div>
    </section>
  )
}

export default Episodes 