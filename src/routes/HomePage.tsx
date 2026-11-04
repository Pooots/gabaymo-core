import { About } from '@/components/home/About'
import { Features } from '@/components/home/Features'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Library } from '@/components/home/Library'
import { Membership } from '@/components/home/Membership'
import { SiteFooter } from '@/components/home/SiteFooter'
import { SiteHeader } from '@/components/home/SiteHeader'

export function HomePage() {
  return (
    <div className="home-shell min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Library />
        <Membership />
        <About />
      </main>
      <SiteFooter />
    </div>
  )
}
