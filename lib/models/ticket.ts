import mongoose, { Schema } from 'mongoose'
import { TicketType, TicketStatus } from '@/app/types/ticket'

// Definir o esquema para Ticket
const ticketSchema = new Schema({
  protocol: {
    type: String,
    required: [true, 'Protocolo é obrigatório'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Tipo de chamado é obrigatório'],
    enum: Object.values(TicketType),
  },
  category: {
    type: String,
    required: false,
    trim: true,
  },
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: Object.values(TicketStatus),
    default: TicketStatus.ABERTO,
  },
  name: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: false,
    trim: true,
  },
  answers: {
    type: Schema.Types.Mixed,
    required: false,
  },
  response: {
    type: String,
    required: false,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Middleware para atualizar a data de updatedAt antes de salvar
ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Verificar se o modelo já existe para evitar recompilação
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema)

export default Ticket 