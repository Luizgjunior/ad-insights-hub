import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Plan } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatROAS(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}×`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function getTrendColor(trend: number): string {
  if (trend > 0) return 'text-success';
  if (trend < 0) return 'text-danger';
  return 'text-muted-foreground';
}

export function getPlanLimit(plan: Plan | null | undefined): number {
  if (!plan) return 1;
  const limits: Record<Plan, number> = { starter: 3, pro: 10, agency: 999 };
  return limits[plan] || 1;
}

export function daysUntil(date: string): number {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPeriodDates(period: 'today' | 'week' | 'month'): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  if (period === 'week') start.setDate(end.getDate() - 7);
  else if (period === 'month') start.setMonth(end.getMonth() - 1);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Bom dia, ${firstName}! 👋`;
  if (hour >= 12 && hour < 18) return `Boa tarde, ${firstName}! 👋`;
  return `Boa noite, ${firstName}! 👋`;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}
