"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type TabType = "tech" | "features" | "architecture";

export default function PortPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tech");

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" as const },
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Winsdsurff
          </h1>
          <p className="text-lg text-gray-400 mb-2">Francisco Mingolla</p>
          <p className="text-xl text-gray-400 mb-2">
            Desarrollador Full Stack & Arquitecto de Sistemas
          </p>
          <p className="text-sm text-gray-500">Desarrollado con Cascade Pro</p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Navigation Tabs */}
          <motion.div className="flex justify-center mb-12" {...fadeInUp}>
            <div className="bg-gray-900/50 backdrop-blur-lg rounded-full p-1 flex gap-2 border border-gray-800">
              {[
                { id: "tech" as TabType, label: "Tecnologías" },
                { id: "features" as TabType, label: "Características" },
                { id: "architecture" as TabType, label: "Arquitectura" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tech Stack Tab */}
          {activeTab === "tech" && (
            <motion.div
              key="tech"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              {/* Frontend */}
              <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl p-8 border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-blue-400">Frontend</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Next.js 16", desc: "Framework React con App Router", level: 95 },
                    { name: "TypeScript", desc: "JavaScript con tipado seguro", level: 90 },
                    { name: "TailwindCSS", desc: "Framework CSS utility-first", level: 95 },
                    {
                      name: "Framer Motion",
                      desc: "Librería de animaciones production-ready",
                      level: 85,
                    },
                    { name: "React Query", desc: "Gestión de estado del servidor", level: 90 },
                    { name: "Zustand", desc: "Gestión de estado simple", level: 85 },
                  ].map((tech, techIndex) => (
                    <motion.div
                      key={tech.name}
                      className="bg-gray-800/50 rounded-xl p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: techIndex * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{tech.name}</h3>
                        <span className="text-xs text-blue-400">{tech.level}%</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{tech.desc}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${tech.level}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Backend */}
              <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl p-8 border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-purple-400">Backend</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Node.js", desc: "Runtime JavaScript", level: 90 },
                    { name: "PostgreSQL", desc: "Base de datos relacional avanzada", level: 85 },
                    { name: "Drizzle ORM", desc: "Toolkit SQL type-safe", level: 88 },
                    { name: "NextAuth.js", desc: "Autenticación para Next.js", level: 85 },
                    { name: "API Routes", desc: "Endpoints API serverless", level: 92 },
                    {
                      name: "Prisma/Drizzle",
                      desc: "Herramientas ORM de base de datos",
                      level: 87,
                    },
                  ].map((tech, techIndex) => (
                    <motion.div
                      key={tech.name}
                      className="bg-gray-800/50 rounded-xl p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: techIndex * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{tech.name}</h3>
                        <span className="text-xs text-purple-400">{tech.level}%</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{tech.desc}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${tech.level}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Features Tab */}
          {activeTab === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl p-8 border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-green-400">
                  Características del Proyecto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: "🏢",
                      title: "Gestión de Socios",
                      desc: "Ciclo de vida completo de socios",
                    },
                    {
                      icon: "💳",
                      title: "Sistema de Pagos",
                      desc: "Procesamiento de pagos secuenciales",
                    },
                    {
                      icon: "📊",
                      title: "Análisis del Dashboard",
                      desc: "Estadísticas y reportes en tiempo real",
                    },
                    {
                      icon: "🔐",
                      title: "Autenticación",
                      desc: "Control de acceso basado en roles seguro",
                    },
                    { icon: "📱", title: "Diseño Responsivo", desc: "Diseño UI/UX mobile-first" },
                    {
                      icon: "⚡",
                      title: "Rendimiento",
                      desc: "Optimizado para velocidad y escalabilidad",
                    },
                    {
                      icon: "🎯",
                      title: "Sistema Vitalicio",
                      desc: "Seguimiento de membresía vitalicia de 360 cuotas",
                    },
                    {
                      icon: "📧",
                      title: "Notificaciones",
                      desc: "Notificaciones a usuarios en tiempo real",
                    },
                  ].map((feature, featureIndex) => (
                    <motion.div
                      key={feature.title}
                      className="bg-gray-800/50 rounded-xl p-6 flex gap-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: featureIndex * 0.1 }}
                    >
                      <div className="text-3xl">{feature.icon}</div>
                      <div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Architecture Tab */}
          {activeTab === "architecture" && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-gray-900/30 backdrop-blur-lg rounded-3xl p-8 border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-orange-400">
                  Arquitectura del Sistema
                </h2>

                {/* Architecture Diagram */}
                <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                  <div className="space-y-4">
                    {/* Frontend Layer */}
                    <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg p-4 border border-blue-700">
                      <h3 className="font-semibold mb-2 text-blue-300">Capa Frontend</h3>
                      <p className="text-sm text-gray-300">
                        Next.js 16 + TypeScript + TailwindCSS + Framer Motion
                      </p>
                    </div>

                    {/* API Layer */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg p-4 border border-purple-700">
                      <h3 className="font-semibold mb-2 text-purple-300">Capa API</h3>
                      <p className="text-sm text-gray-300">
                        Next.js API Routes + NextAuth.js + Validación
                      </p>
                    </div>

                    {/* Business Logic */}
                    <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-lg p-4 border border-green-700">
                      <h3 className="font-semibold mb-2 text-green-300">Lógica de Negocio</h3>
                      <p className="text-sm text-gray-300">
                        Service Layer + Domain Models + Error Handling
                      </p>
                    </div>

                    {/* Data Layer */}
                    <div className="bg-gradient-to-r from-orange-900/50 to-orange-800/50 rounded-lg p-4 border border-orange-700">
                      <h3 className="font-semibold mb-2 text-orange-300">Capa de Datos</h3>
                      <p className="text-sm text-gray-300">
                        PostgreSQL + Drizzle ORM + Migraciones
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Patterns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: "Repository Pattern", desc: "Abstracción limpia de acceso a datos" },
                    { title: "Service Layer", desc: "Separación de lógica de negocio" },
                    { title: "Error Boundaries", desc: "Manejo elegante de errores" },
                    { title: "Caching Strategy", desc: "Optimización de rendimiento" },
                    { title: "Type Safety", desc: "TypeScript de extremo a extremo" },
                    { title: "Testing", desc: "Tests unitarios y de integración" },
                  ].map((pattern) => (
                    <motion.div
                      key={pattern.title}
                      className="bg-gray-800/50 rounded-xl p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h3 className="font-semibold mb-2 text-orange-300">{pattern.title}</h3>
                      <p className="text-sm text-gray-400">{pattern.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Cascade Pro Section */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 backdrop-blur-lg rounded-3xl p-8 border border-cyan-800">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Desarrollado con Cascade Pro
              </h2>
              <p className="text-gray-300 mb-6">
                Asistente de desarrollo avanzado con IA que permite generación de código rápida y de
                alta calidad con manejo inteligente de errores, optimización de rendimiento e
                implementación de mejores prácticas.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                {[
                  "Generación Inteligente de Código",
                  "Detección de Errores en Tiempo Real",
                  "Optimización de Rendimiento",
                  "Integración de Mejores Prácticas",
                  "Garantía de Type Safety",
                  "Testing Automatizado",
                ].map((capability) => (
                  <span
                    key={capability}
                    className="bg-cyan-800/30 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-700"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-16 text-center text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>Construido con pasión y precisión por Winsdsurff</p>
            <p className="text-sm mt-2">
              Desarrollador Full Stack | Arquitecto de Sistemas | Impulsor de Innovación
            </p>
            <p className="text-xs mt-4 text-gray-600">Desarrollo Web: Francisco Mingolla</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
