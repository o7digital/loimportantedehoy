import { useId, useState } from "react";
import { site, type MembershipPlanId } from "../config/site";
import MembershipDemo from "./MembershipDemo";

export default function MembershipPricing() {
  const [planId, setPlanId] = useState<MembershipPlanId>("espanol");
  const group = useId();
  const plan = site.membership.plans.find(item => item.id === planId)!;
  return <aside className="price-card membership-pricing" aria-label="Precios de lanzamiento">
    <div className="price-top"><span>PRECIOS DE LANZAMIENTO</span><span>MENSUAL</span></div>
    <fieldset className="membership-options"><legend>Elige tu idioma</legend>{site.membership.plans.map(item => <label key={item.id} className="membership-option" data-selected={planId === item.id}>
      <input type="radio" name={group} value={item.id} checked={planId === item.id} onChange={() => setPlanId(item.id)} />
      <span>{item.name}</span><strong>${item.price}<small> MXN / mes</small></strong>
    </label>)}</fieldset>
    <div className="price-mark" aria-live="polite"><small>$</small><strong>{plan.price}</strong><span>MXN<br />al mes</span></div>
    <p>{plan.description}</p>
    <div className="membership-inclusions"><p>✓ La edición completa</p><p>✓ El archivo de la revista</p><p>✓ Lectura en desktop y móvil</p></div>
    <MembershipDemo initialPlan={plan.id} triggerClassName="button button-cream" />
    <small className="membership-availability">Vista previa · sin cobros. Versiones en otros idiomas en preparación.</small>
  </aside>;
}
