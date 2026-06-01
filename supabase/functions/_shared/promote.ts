import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export type PromoteResult =
  | { ok: true; submissionId: string; participantName: string; alreadyPaid?: boolean }
  | { ok: false; error: string };

export async function promotePendingSubmission(
  supabase: SupabaseClient,
  pendingId: string
): Promise<PromoteResult> {
  const { data: row, error } = await supabase
    .from('pending_submissions')
    .select('id, status, data')
    .eq('id', pendingId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: error?.message || 'Pending submission not found' };
  }

  const payload = row.data as {
    participant?: Record<string, unknown>;
    targetSubmissionId?: string;
  };
  const participant = payload?.participant;
  if (!participant || typeof participant !== 'object') {
    return { ok: false, error: 'Invalid pending submission payload' };
  }

  const submissionId =
    (participant.id as string) ||
    payload.targetSubmissionId ||
    pendingId.replace(/^pending_/, 'sub_');

  if (row.status === 'paid') {
    return {
      ok: true,
      submissionId,
      participantName: String(participant.name || 'Player'),
      alreadyPaid: true,
    };
  }

  const { error: upsertError } = await supabase
    .from('submissions')
    .upsert({ id: submissionId, data: participant }, { onConflict: 'id' });

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  const { error: updateError } = await supabase
    .from('pending_submissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', pendingId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return {
    ok: true,
    submissionId,
    participantName: String(participant.name || 'Player'),
  };
}
