export default {
  name: 'wiringDiagram',
  title: 'Wiring Diagram',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
     {
       name: 'diagramImages',
       title: 'Diagram Images',
       type: 'array',
       of: [{ type: 'image' }],
       options: {
         hotspot: false,
       },
     },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
    },
    {
      name: 'wireColors',
      title: 'Wire Colors',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'components',
      title: 'Components',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'connectors',
      title: 'Connectors',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'ecuPins',
      title: 'ECU Pins',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'yearRange',
      title: 'Year Range',
      type: 'string',
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
     {
       name: 'identifier',
       title: 'Identifier',
       type: 'string',
       description: 'Alphanumeric code from top-left corner used to group related diagrams',
     },
     {
       name: 'publishedAt',
       title: 'Published at',
       type: 'datetime',
     },
  ],
   preview: {
     select: {
       title: 'title',
       category: 'category',
       media: 'diagramImages',
     },
   },
}
