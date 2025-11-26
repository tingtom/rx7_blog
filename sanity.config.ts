import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'
import React from 'react'

export default defineConfig({
  name: 'default',
  title: 'rx7.pro',
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
  studio: {
    components: {
      logo: () => {
        return React.createElement(
          'div',
          {
            style: {
              fontSize: '1.5em',
              fontWeight: 'bold',
              color: 'white',
              padding: '0.5em'
            }
          },
          'rx7',
          React.createElement(
            'span',
            {
              style: {
                color: '#ef4444'
              }
            },
            '.pro'
          )
        )
      }
    }
  }
})
