import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { site, type MembershipPlanId } from "../config/site";

export default function MembershipDemo({ initialPlan = "espanol", label = "Conocer esta membresía", triggerClassName = "button button-red" }: { initialPlan?: MembershipPlanId; label?: string; triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [planId, setPlanId] = useState<MembershipPlanId>(initialPlan);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const plan = site.membership.plans.find(item => item.id === planId)!;
  useEffect(() => {
    if (open) { dialog.current?.showModal(); document.body.style.overflow = "hidden"; }
    else { dialog.current?.close(); document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  function submit(event: FormEvent) { event.preventDefault(); setSent(true); }
  return <>
    <button className={triggerClassName} type="button" onClick={() => { setPlanId(initialPlan); setSent(false); setOpen(true); }}>{label} <span aria-hidden="true">↗</span></button>
    <dialog ref={dialog} className="membership-dialog" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }} aria-labelledby={titleId}>
      <section className="member-modal">
        <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
        <div className="modal-brand"><span className="prism" aria-hidden="true"><span className="prism-beam" /></span><span>PRECIOS DE LANZAMIENTO · DEMOSTRACIÓN</span></div>
        {sent ? <div className="demo-success" role="status"><h2 id={titleId}>Así será tu membresía.</h2><p>{plan.name} · ${plan.price} MXN al mes.</p><p>Esta es una demostración. No se han enviado tus datos, creado una cuenta ni realizado ningún cobro.</p><button className="button button-red" type="button" onClick={() => setOpen(false)}>Entendido</button></div> : <>
          <h2 id={titleId}>Haz espacio para<br /><em>lo importante.</em></h2>
          <form onSubmit={submit}>
            <label>Tu membresía<select value={planId} onChange={event => setPlanId(event.target.value as MembershipPlanId)}>{site.membership.plans.map(item => <option key={item.id} value={item.id}>{item.name} · ${item.price} MXN / mes</option>)}</select></label>
            <p className="membership-summary" aria-live="polite">{plan.name} · <strong>${plan.price} MXN al mes</strong></p>
            <label>Correo electrónico<input type="email" required autoComplete="email" placeholder="tu@email.com" /></label>
            <label>Tu nombre<input type="text" required autoComplete="name" placeholder="Nombre completo" /></label>
            <button className="button button-red" type="submit">Continuar (demo) <span aria-hidden="true">↗</span></button>
          </form>
          <small>Vista previa sin cobros. Las versiones en otros idiomas están en preparación.</small>
        </>}
      </section>
    </dialog>
  </>;
}
