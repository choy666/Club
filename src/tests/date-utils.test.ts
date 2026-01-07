/**
 * Tests para verificar el correcto manejo de fechas locales
 * Estos tests aseguran que no haya desfasajes de días
 */

import { describe, it, expect } from 'vitest';
import {
  toLocalDateOnly,
  fromLocalDateOnly,
  getTodayLocal,
  addMonthsLocal,
  compareDates,
  isValidDateOnly,
  formatDateForDisplay
} from '@/lib/utils/date-utils';

describe('Utils de Fechas Locales', () => {
  describe('toLocalDateOnly', () => {
    it('debe formatear Date correctamente', () => {
      const date = new Date(2026, 0, 7); // 7 de enero de 2026
      expect(toLocalDateOnly(date)).toBe('2026-01-07');
    });

    it('debe mantener string YYYY-MM-DD sin cambios', () => {
      const dateString = '2026-01-07';
      expect(toLocalDateOnly(dateString)).toBe('2026-01-07');
    });

    it('debe convertir otros formatos de string', () => {
      const isoString = '2026-01-07T10:30:00.000Z';
      expect(toLocalDateOnly(isoString)).toBe('2026-01-07');
    });

    it('debe lanzar error para fecha inválida', () => {
      expect(() => toLocalDateOnly('invalid')).toThrow();
      expect(() => toLocalDateOnly(new Date('invalid'))).toThrow();
    });
  });

  describe('fromLocalDateOnly', () => {
    it('debe crear Date desde string YYYY-MM-DD', () => {
      const date = fromLocalDateOnly('2026-01-07');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // Enero es 0
      expect(date.getDate()).toBe(7);
    });

    it('debe lanzar error para formato inválido', () => {
      expect(() => fromLocalDateOnly('2026/01/07')).toThrow();
      expect(() => fromLocalDateOnly('01-07-2026')).toThrow();
    });

    it('debe lanzar error para fecha inválida', () => {
      expect(() => fromLocalDateOnly('2026-02-30')).toThrow(); // Febrero no tiene 30 días
    });
  });

  describe('getTodayLocal', () => {
    it('debe retornar fecha actual en formato YYYY-MM-DD', () => {
      const today = getTodayLocal();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Verificar que sea realmente la fecha de hoy
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(today).toBe(expected);
    });
  });

  describe('addMonthsLocal', () => {
    it('debe agregar meses correctamente', () => {
      const date = new Date(2026, 0, 7); // 7 de enero de 2026
      const result = addMonthsLocal(date, 1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // Febrero
      expect(result.getDate()).toBe(7);
    });

    it('debe manejar fin de mes correctamente', () => {
      const date = new Date(2026, 0, 31); // 31 de enero de 2026
      const result = addMonthsLocal(date, 1); // Febrero no tiene 31 días
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // Febrero
      expect(result.getDate()).toBe(28); // Último día de febrero (2026 no es bisiesto)
    });

    it('debe funcionar con string', () => {
      const result = addMonthsLocal('2026-01-07', 2);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2); // Marzo
      expect(result.getDate()).toBe(7);
    });

    it('debe manejar múltiples años', () => {
      const date = new Date(2026, 11, 7); // 7 de diciembre de 2026
      const result = addMonthsLocal(date, 2);
      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(1); // Febrero
      expect(result.getDate()).toBe(7);
    });
  });

  describe('compareDates', () => {
    it('debe comparar fechas correctamente', () => {
      expect(compareDates('2026-01-07', '2026-01-08')).toBe(-1);
      expect(compareDates('2026-01-08', '2026-01-07')).toBe(1);
      expect(compareDates('2026-01-07', '2026-01-07')).toBe(0);
    });
  });

  describe('isValidDateOnly', () => {
    it('debe validar fechas correctas', () => {
      expect(isValidDateOnly('2026-01-07')).toBe(true);
      expect(isValidDateOnly('2024-02-29')).toBe(true); // Año bisiesto
    });

    it('debe rechazar fechas inválidas', () => {
      expect(isValidDateOnly('2026-02-30')).toBe(false);
      expect(isValidDateOnly('2026-13-01')).toBe(false);
      expect(isValidDateOnly('2026/01/07')).toBe(false);
      expect(isValidDateOnly('invalid')).toBe(false);
    });
  });

  describe('formatDateForDisplay', () => {
    it('debe formatear fecha para visualización', () => {
      const date = new Date(2026, 0, 7);
      const formatted = formatDateForDisplay(date);
      expect(formatted).toMatch(/7 de enero de 2026/);
    });

    it('debe funcionar con string', () => {
      const formatted = formatDateForDisplay('2026-01-07');
      expect(formatted).toMatch(/7 de enero de 2026/);
    });
  });

  describe('Casos límite y edge cases', () => {
    it('debe manejar año bisiesto correctamente', () => {
      const leapDate = fromLocalDateOnly('2024-02-29'); // 2024 es bisiesto
      expect(leapDate.getFullYear()).toBe(2024);
      expect(leapDate.getMonth()).toBe(1);
      expect(leapDate.getDate()).toBe(29);

      // Agregar un año a fecha bisiesta
      const nextYear = addMonthsLocal(leapDate, 12);
      expect(nextYear.getFullYear()).toBe(2025);
      expect(nextYear.getMonth()).toBe(1);
      expect(nextYear.getDate()).toBe(28); // 2025 no es bisiesto
    });

    it('debe manejar cambio de año', () => {
      const newYear = fromLocalDateOnly('2025-12-31');
      const nextDay = addMonthsLocal(newYear, 1);
      expect(nextDay.getFullYear()).toBe(2026);
      expect(nextDay.getMonth()).toBe(0);
      expect(nextDay.getDate()).toBe(31);
    });

    it('debe mantener consistencia en conversiones', () => {
      // Fecha de hoy: 07/01/2026
      const originalDate = '2026-01-07';
      
      // Convertir a Date y luego de vuelta a string
      const dateObj = fromLocalDateOnly(originalDate);
      const backToString = toLocalDateOnly(dateObj);
      
      expect(backToString).toBe(originalDate);
    });
  });
});

describe('Integración con sistema de inscripciones', () => {
  it('simular inscripción del día 07/01/2026', () => {
    // Simular el caso exacto del usuario
    const inscriptionDate = '2026-01-07';
    
    // Verificar que la fecha se mantenga consistente
    expect(isValidDateOnly(inscriptionDate)).toBe(true);
    
    // Convertir a Date y verificar
    const dateObj = fromLocalDateOnly(inscriptionDate);
    expect(dateObj.getFullYear()).toBe(2026);
    expect(dateObj.getMonth()).toBe(0); // Enero
    expect(dateObj.getDate()).toBe(7);
    
    // Generar primera cuota (siguiente mes)
    const firstDue = addMonthsLocal(dateObj, 1);
    expect(firstDue.getFullYear()).toBe(2026);
    expect(firstDue.getMonth()).toBe(1); // Febrero
    expect(firstDue.getDate()).toBe(7);
    
    // Verificar formato para BD
    const firstDueString = toLocalDateOnly(firstDue);
    expect(firstDueString).toBe('2026-02-07');
  });

  it('verificar formateo para visualización en tablas', () => {
    // Simular la función formatDisplayDate usada en las tablas
    function formatDisplayDate(dateStr: string): string {
      if (dateStr.includes('T')) {
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
      } else {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
    }

    // Probar formato YYYY-MM-DD (como viene de la BD ahora)
    expect(formatDisplayDate('2026-01-07')).toBe('07/01/2026');
    
    // Probar formato ISO (por compatibilidad)
    expect(formatDisplayDate('2026-01-07T10:30:00.000Z')).toBe('07/01/2026');
    
    // Probar caso real: inscripción de hoy
    const today = getTodayLocal();
    const [year, month, day] = today.split('-');
    expect(formatDisplayDate(today)).toBe(`${day}/${month}/${year}`);
  });
});
