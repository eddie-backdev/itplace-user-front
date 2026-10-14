import type { CarrierCode } from './membership';

export function getPartnerNoteForCarrier<Note extends { partnerId: number; carrier: string }>(
  notes: readonly Note[],
  partnerId: number,
  carrier?: CarrierCode | null
): Note | null {
  if (!carrier) return null;
  return notes.find((note) => note.partnerId === partnerId && note.carrier === carrier) ?? null;
}
