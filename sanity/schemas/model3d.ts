export default {
  name: 'model3d',
  title: '3D Model',
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
      rows: 4,
    },
    {
      name: 'modelFile',
      title: 'Model File URL',
      type: 'url',
      description: 'URL to the 3D model file (STL, OBJ, etc.)',
    },
    {
      name: 'previewImage',
      title: 'Preview Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Engine Parts', value: 'engine' },
          { title: 'Exterior', value: 'exterior' },
          { title: 'Interior', value: 'interior' },
          { title: 'Accessories', value: 'accessories' },
        ],
      },
    },
    {
      name: 'downloadCount',
      title: 'Download Count',
      type: 'number',
      initialValue: 0,
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
      media: 'previewImage',
    },
  },
}
