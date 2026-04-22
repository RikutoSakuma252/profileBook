"use client";

import { useActionState, useState } from "react";
import { deleteProfileAction, type DeleteActionState } from "./actions";

const initialState: DeleteActionState = { status: "idle" };

export function AdminDeleteButton({
  id,
  displayName,
}: {
  id: string;
  displayName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, runAction, isPending] = useActionState(
    deleteProfileAction,
    initialState
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-sm border border-rouge/60 px-3 py-1.5 font-typewriter text-[11px] uppercase tracking-[0.25em] text-rouge transition-colors hover:bg-rouge hover:text-paper"
      >
        admin · delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm border border-rouge/60 bg-rouge/10 px-3 py-2 font-typewriter text-[11px] uppercase tracking-[0.2em]">
      <span className="text-rose">
        「{displayName}」を削除します。取り消せません。
      </span>
      <button
        type="button"
        onClick={() => runAction({ id })}
        disabled={isPending}
        className="rounded-sm bg-rouge px-3 py-1 text-paper disabled:opacity-40"
      >
        {isPending ? "削除中…" : "confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded-sm border border-paper/30 px-3 py-1 text-paper/70 hover:border-paper hover:text-paper"
      >
        cancel
      </button>
      {state.status === "error" ? (
        <span className="w-full text-rose">{state.message}</span>
      ) : null}
    </div>
  );
}
