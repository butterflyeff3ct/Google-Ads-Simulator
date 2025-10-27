export interface AdPreviewData {
  finalUrl: string
  displayPath1: string
  displayPath2: string
  headlines: string[]
  descriptions: string[]
  phoneNumber: string
  enableCalls: boolean
  enableLeadForm: boolean
  sitelinks: { text: string; url: string }[]
  callouts: string[]
  structuredSnippets: { header: string; values: string[] }[]
  images: { url: string; alt: string }[]
  businessName: string
  logo: { url: string; alt: string } | null
}

export interface PreviewComponentProps {
  data: AdPreviewData
  onOpenLeadForm?: () => void
}

export interface CarouselProps {
  data: AdPreviewData
  onOpenLeadForm?: () => void
  type: 'mobile' | 'desktop'
}
