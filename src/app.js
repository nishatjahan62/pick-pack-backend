import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import errorHandler from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import categoryRoutes from './routes/categories.routes.js'
import productRoutes from "./routes/products.routes.js"
import orderRoutes from "./routes/orders.routes.js"
import restockRoutes from './routes/restock.routes.js'
import statsRoutes from './routes/stats.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import adminRoutes from './routes/admin.routes.js'

dotenv.config()
connectDB()

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))



app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.get('/', (req, res) => {
  res.json({ message: 'Pick Pack API running ✅' })
})

// routes
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/restock', restockRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/admin', adminRoutes)



app.use(errorHandler)

export default app