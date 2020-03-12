import * as mongoose from 'mongoose'

interface ISourceDocument extends mongoose.Document {
  id: string
  url: string
  contents: string
}

export const SourceDocument = mongoose.model<ISourceDocument>(
  'SourceDocument',
  new mongoose.Schema({
    url: { type: 'string', unique: true },
    contents: { type: 'string' }
  })
)

interface IDocumentTokens extends mongoose.Document {
  url: string
  tokens: Record<string, string[]>
}

export const DocumentTokens = mongoose.model<IDocumentTokens>(
  'DocumentTokens',
  new mongoose.Schema({
    url: { type: 'string', unique: true },
    tokens: mongoose.Schema.Types.Mixed
  })
)
