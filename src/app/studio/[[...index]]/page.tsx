'use client'

import { StudioProvider, StudioLayout } from 'sanity'
import config from '../../../../sanity.config'
import { NextStudio } from 'next-sanity/studio'

export default function StudioPage() {
  return (
    <NextStudio config={config}>
      <StudioProvider config={config}>
        <StudioLayout />
      </StudioProvider>
    </NextStudio>
  )
}
