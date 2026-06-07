import type { ReactNode } from 'react'

import { LandingFooter, LandingHeader } from '#/components/LandingChrome'

type BlogChromeProps = {
  children: ReactNode
}

export function BlogChrome({ children }: BlogChromeProps) {
  return (
    <>
      <main className="page-wrap px-4 pb-8">
        <LandingHeader />
        {children}
      </main>

      <LandingFooter />
    </>
  )
}
