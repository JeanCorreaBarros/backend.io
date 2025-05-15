"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { userService } from "@/lib/local-storage-service"

export default function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Intentar iniciar sesión
      const user = userService.login(formData.email, formData.password)

      if (user) {
        // Simular un pequeño retraso para dar sensación de autenticación
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Establecer una cookie simulada para el middleware
        document.cookie = "fake_auth=true; path=/; max-age=86400; SameSite=Strict"

        // Redirigir al dashboard
        router.push("/dashboard")
        router.refresh()
      } else {
        throw new Error("Credenciales incorrectas. Utiliza jeancorrea@gmail.com / 110621")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-600 mb-2">Backend.io</h1>
          <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Accede a tu cuenta para continuar
          </p>
        </div>


        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              placeholder="demo@backendio.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                placeholder="123456789"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-medium transition",
              isLoading
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white",
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 size={18} className="animate-spin mr-2" />
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          <div className="text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-orange-500 hover:text-orange-600 font-medium">
                Regístrate
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
