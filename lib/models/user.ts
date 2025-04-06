import mongoose, { Schema, Document, models, model } from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: string
  department: string
  permissions: {
    viewTickets: boolean
    respondTickets: boolean
    editTickets: boolean
    deleteTickets: boolean
    manageUsers: boolean
    viewDashboard: boolean
    viewAllDepartments: boolean
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'O nome é obrigatório'],
    },
    email: {
      type: String,
      required: [true, 'O email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'A senha é obrigatória'],
      minlength: [6, 'A senha deve ter no mínimo 6 caracteres'],
      select: false, // Não retorna a senha nas consultas
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'staff', 'director'],
      default: 'staff',
    },
    department: {
      type: String,
      enum: ['diretoria', 'juridico', 'pedagogico', 'secretaria', 'ti', 'administrativo', 'financeiro'],
      default: 'administrativo',
    },
    permissions: {
      viewTickets: {
        type: Boolean,
        default: true
      },
      respondTickets: {
        type: Boolean,
        default: false
      },
      editTickets: {
        type: Boolean,
        default: false
      },
      deleteTickets: {
        type: Boolean,
        default: false
      },
      manageUsers: {
        type: Boolean,
        default: false
      },
      viewDashboard: {
        type: Boolean,
        default: false
      },
      viewAllDepartments: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true,
  }
)

// Middleware para criptografar a senha antes de salvar
userSchema.pre('save', async function (next) {
  // Só encripta a senha se ela foi modificada
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Middleware para definir permissões padrão baseadas na role
userSchema.pre('save', function(next) {
  // Se as permissões foram explicitamente definidas, não faz nada
  if (this.isModified('permissions')) return next()
  
  // Define permissões baseadas na role se a role foi modificada
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = {
          viewTickets: true,
          respondTickets: true,
          editTickets: true,
          deleteTickets: true,
          manageUsers: true,
          viewDashboard: true,
          viewAllDepartments: true
        }
        break
      case 'director':
        this.permissions = {
          viewTickets: true,
          respondTickets: true,
          editTickets: true,
          deleteTickets: false,
          manageUsers: false,
          viewDashboard: true,
          viewAllDepartments: true
        }
        break
      case 'manager':
        this.permissions = {
          viewTickets: true,
          respondTickets: true,
          editTickets: true,
          deleteTickets: false,
          manageUsers: false,
          viewDashboard: true,
          viewAllDepartments: false
        }
        break
      case 'staff':
        this.permissions = {
          viewTickets: true,
          respondTickets: true,
          editTickets: false,
          deleteTickets: false,
          manageUsers: false,
          viewDashboard: false,
          viewAllDepartments: false
        }
        break
    }
  }
  
  next()
})

// Método para comparar senhas
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    return false
  }
}

// Evita registro duplicado do modelo durante o desenvolvimento Hot Reload
const User = models.User || model<IUser>('User', userSchema)

export default User 