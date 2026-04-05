import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { fetchRedditBlogPosts, type RedditBlogPost, type RedditBlogResponse } from '../services/blog'
import blogBackground from '../../public/blog-background.webp'

const Blog: React.FC = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Parallax effect for background
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  
  const [posts, setPosts] = useState<RedditBlogPost[]>([])
  const [debugInfo, setDebugInfo] = useState<RedditBlogResponse['debug']>()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState<number>(4)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const data = await fetchRedditBlogPosts(12, { debug: import.meta.env.DEV })
        if (isMounted) {
          setPosts(data.posts || [])
          setDebugInfo(data.debug)
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load blog posts')
          setLoading(false)
        }
      }
    })()
    return () => { isMounted = false }
  }, [])

  // Log debug info to console only in development; never render it in UI
  useEffect(() => {
    if (import.meta.env.DEV && debugInfo) {
      // eslint-disable-next-line no-console
      // Debug info available but not logged in production
    }
  }, [debugInfo])

  return (
    <section id="blog" className="relative min-h-screen py-20 overflow-hidden" ref={ref}>
      {/* Parallax Background */}
      <motion.div 
        className="absolute inset-0 will-change-transform"
        style={{ y: backgroundY }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${blogBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </motion.div>

      {/* Content */}
      <div className="container relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 gradient-text">
            Our Blog
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Dive into the darker corners of storytelling with our latest thoughts, insights, and discussions.
          </p>
        </motion.div>

        {loading && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-3 bg-dark/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-dark-border">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-text-secondary">Loading latest posts...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block bg-red-500/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-red-500/30">
              <span className="text-red-400">{error}</span>
            </div>
          </motion.div>
        )}

        {posts.length > 0 ? (
          <>
            <div className="max-w-4xl mx-auto space-y-8">
              {posts.slice(0, visibleCount).map((post, index) => (
                <motion.article
                  key={post.id}
                  className="group"
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                >
                  <div className="bg-dark/40 backdrop-blur-sm rounded-2xl border border-dark-border/50 p-8 hover:bg-dark/60 hover:border-primary/30 transition-all duration-500 group-hover:-translate-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                      <div className="flex-1">
                        <motion.h3 
                          className="text-2xl font-bold mb-4 text-white group-hover:text-primary transition-colors duration-300"
                          whileHover={{ scale: 1.02 }}
                        >
                          {post.title}
                        </motion.h3>
                        <p className="text-text-secondary text-lg leading-relaxed mb-6">
                          {post.selftext 
                            ? `${post.selftext.slice(0, 300)}${post.selftext.length > 300 ? '...' : ''}` 
                            : 'Click to read the full post on Reddit and join the discussion.'
                          }
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4 text-text-muted">
                            <span className="text-sm">
                              {new Date(post.createdUtc * 1000).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <motion.a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Read Full Post
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </motion.a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {posts.length > visibleCount && (
              <motion.div 
                className="text-center mt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {visibleCount < 16 ? (
                  <motion.button
                    className="bg-dark/60 backdrop-blur-sm text-white border-2 border-primary hover:bg-primary hover:border-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300 mr-4"
                    onClick={() => setVisibleCount((v) => Math.min(v + 4, 16))}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Load 4 More Posts
                  </motion.button>
                ) : (
                  <motion.a
                    href="https://www.reddit.com/r/thedaysgrimm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-dark/60 backdrop-blur-sm text-white border-2 border-primary hover:bg-primary hover:border-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300 inline-block"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Visit Our Reddit Community
                  </motion.a>
                )}
              </motion.div>
            )}
          </>
        ) : (
          !loading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
              className="text-center py-20"
            >
              <div className="bg-dark/60 backdrop-blur-sm rounded-2xl border border-dark-border/50 p-12 max-w-2xl mx-auto">
                <h3 className="text-3xl font-bold mb-6 gradient-text">Coming Soon</h3>
                <p className="text-xl text-text-secondary leading-relaxed">
                  We're working on bringing you the latest posts from our community. 
                  Stay tuned for thought-provoking content and discussions.
                </p>
              </div>
            </motion.div>
          )
        )}
      </div>
    </section>
  )
}

export default Blog 