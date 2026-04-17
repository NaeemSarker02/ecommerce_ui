import"./app-CTs3nlI0.js";var e=`storefront-template-access`,t=[{key:`general-store`,label:`General Store`,description:`Mixed catalog with different product types.`,recommendedTheme:`universal-minimal`},{key:`electronics`,label:`Electronics`,description:`Devices, accessories, launches, and technical products.`,recommendedTheme:`tech-electronics`},{key:`fashion`,label:`Fashion`,description:`Apparel, beauty, curated looks, and brand storytelling.`,recommendedTheme:`fashion-lifestyle`},{key:`essentials`,label:`Essentials`,description:`Groceries, care products, repeat purchases, and trust-heavy shopping.`,recommendedTheme:`daily-essentials`}],n=[{key:`universal-minimal`,name:`Universal Minimal`,badge:`Default`,bestFor:`Best for general retail`,audience:[`General store`,`Multi-category catalog`,`Neutral SaaS demo`],description:`Clean, neutral storefront for general retail and shared SaaS validation.`,previewImage:`/images/banner-general.svg`,previewAlt:`Universal Minimal storefront preview`,sampleCategory:`electronics`,sampleProduct:`iphone-17-pro-max`},{key:`tech-electronics`,name:`Tech and Electronics`,badge:`Devices`,bestFor:`Best for electronics`,audience:[`Gadgets`,`Launch campaigns`,`Specs-heavy shopping`],description:`Best for gadgets, launches, specifications, and compact utility-first browsing.`,previewImage:`/images/banner-tech.svg`,previewAlt:`Tech and Electronics storefront preview`,sampleCategory:`electronics`,sampleProduct:`iphone-17-pro-max`},{key:`fashion-lifestyle`,name:`Fashion and Lifestyle`,badge:`Editorial`,bestFor:`Best for fashion`,audience:[`Apparel`,`Beauty`,`Brand storytelling`],description:`Optimized for apparel, beauty, mood-driven content, and curated product storytelling.`,previewImage:`/images/banner-fashion.svg`,previewAlt:`Fashion and Lifestyle storefront preview`,sampleCategory:`apparels`,sampleProduct:`premium-performance-tshirt`},{key:`daily-essentials`,name:`Daily Essentials`,badge:`Fast-moving`,bestFor:`Best for essentials`,audience:[`Groceries`,`Care products`,`Repeat purchases`],description:`Built for essentials, refill-heavy catalogs, trust cues, and repeat purchase flow.`,previewImage:`/images/banner-essentials.svg`,previewAlt:`Daily Essentials storefront preview`,sampleCategory:`baby-care`,sampleProduct:`savlon-liquid-1l`}],r=[{key:`home`,label:`Home`,description:`Storefront landing page`,helper:`Best place to understand the full template`},{key:`search`,label:`Search`,description:`Browse all products`,helper:`Open the full product listing`},{key:`category`,label:`Category`,description:`Open a safe sample category`,helper:`Jump into a ready-to-browse category`},{key:`product`,label:`Product`,description:`Open a safe sample product`,helper:`See a single product page instantly`},{key:`cart`,label:`Cart`,description:`Open the cart flow`,helper:`Test the ordering experience`}];function i(e){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function a(e){return n.find(t=>t.key===e)||n[0]}function o(e){return r.find(t=>t.key===e)||r[0]}function s(e){return t.find(t=>t.key===e)||null}function c(e,t){let n=a(e),r=`/src/themes/${n.key}/pages`;switch(t){case`search`:return`${r}/search.html`;case`category`:return`${r}/category.html?category=${encodeURIComponent(n.sampleCategory)}`;case`product`:return`${r}/product.html?product=${encodeURIComponent(n.sampleProduct)}`;case`cart`:return`${r}/cart.html`;default:return`${r}/index.html`}}function l(t,n){let r=d()||{};localStorage.setItem(e,JSON.stringify({...r,themeKey:t,destinationKey:n}))}function u(t){let n=d()||{};localStorage.setItem(e,JSON.stringify({...n,businessKey:t}))}function d(){try{let t=localStorage.getItem(e);return t?JSON.parse(t):null}catch{return null}}function f(e,t){let n=o(t);return`
    <a
      class="portal-theme-shortcut"
      href="${c(e,t)}"
      data-theme-key="${e}"
      data-destination-key="${t}"
    >${n?.label||t}</a>
  `}function p(e){let t=document.querySelector(`[data-destination-options]`);t&&(t.innerHTML=r.map(t=>`
      <button
        class="portal-choice-card ${t.key===e?`is-active`:``}"
        type="button"
        data-destination-option="${t.key}"
      >
        <span class="portal-choice-title">${t.label}</span>
        <span class="portal-choice-description">${t.description}</span>
        <span class="portal-choice-meta">${t.helper}</span>
      </button>
    `).join(``))}function m(e){let n=document.querySelector(`[data-business-options]`);n&&(n.innerHTML=t.map(t=>{let n=t.key===e,r=a(t.recommendedTheme);return`
      <button
        class="portal-choice-card portal-choice-card-light ${n?`is-active`:``}"
        type="button"
        data-business-option="${t.key}"
      >
        <span class="portal-choice-title">${t.label}</span>
        <span class="portal-choice-description">${t.description}</span>
        <span class="portal-choice-meta">Recommends ${i(r.name)}</span>
      </button>
    `}).join(``))}function h(e,t){let n=document.querySelector(`[data-business-summary]`),r=document.querySelector(`[data-recommendation-panel]`),i=s(e),o=a(t);n&&(i?n.textContent=`${i.label}: ${i.description}`:n.textContent=`Select the business type that best matches your store.`),r&&(i?r.textContent=`Recommended template: ${o.name}. ${o.bestFor}.`:r.textContent=`Recommendation: choose a business type above to auto-select the most suitable template, or manually pick any template.`)}function g(e,t){let n=Array.from(document.querySelectorAll(`[data-wizard-indicator]`)),r=Array.from(document.querySelectorAll(`[data-wizard-step]`)),i=document.querySelector(`[data-wizard-helper]`),a=document.querySelector(`[data-wizard-back]`),o=document.querySelector(`[data-wizard-next]`),s=document.querySelector(`[data-launch-link]`),c=e===1?!!t.businessKey:e===2?!!t.destinationKey:!1;n.forEach(t=>{let n=Number(t.dataset.wizardIndicator||0);t.className=`portal-step-indicator ${n===e?`is-active`:n<e?`is-complete`:``}`}),r.forEach(t=>{t.hidden=t.dataset.wizardStep!==String(e)}),a instanceof HTMLButtonElement&&(a.hidden=e===1),o instanceof HTMLButtonElement&&(o.hidden=e===3,o.disabled=!c,o.classList.toggle(`opacity-50`,!c),o.classList.toggle(`cursor-not-allowed`,!c)),s instanceof HTMLAnchorElement&&s.classList.toggle(`hidden`,e!==3),i&&(e===1?i.textContent=t.businessKey?`Good. The wizard has identified a matching template recommendation. Continue to choose the starting page.`:`Choose your business type to begin the guided setup.`:e===2?i.textContent=t.destinationKey?`Starting page selected. Continue to review the chosen template before opening it.`:`Choose the first page your users should see.`:i.textContent=`Review the selected template, adjust it if needed, and open the chosen storefront experience.`)}function _(e){let t=a(e),n=document.querySelector(`[data-selected-badge]`),r=document.querySelector(`[data-selected-image]`),o=document.querySelector(`[data-selected-name]`),s=document.querySelector(`[data-selected-description]`),c=document.querySelector(`[data-selected-tags]`);n&&(n.textContent=t.badge),r instanceof HTMLImageElement&&(r.src=t.previewImage,r.alt=t.previewAlt),o&&(o.textContent=t.name),s&&(s.textContent=`${t.description} ${t.bestFor}.`),c&&(c.innerHTML=[t.bestFor,...t.audience||[]].map(e=>`<span class="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">${i(e)}</span>`).join(``))}function v(e){let t=document.querySelector(`[data-theme-card-grid]`);t&&(t.innerHTML=n.map(t=>{let n=t.key===e;return`
      <article class="portal-theme-card ${n?`is-active`:``}" data-theme-card="${t.key}">
        <div class="portal-theme-media">
          <img class="h-full w-full object-cover" src="${t.previewImage}" alt="${t.previewAlt}" loading="lazy">
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-slate-950/28 to-transparent"></div>
          <span class="portal-theme-media-badge">${t.badge}</span>
        </div>
        <div class="portal-theme-body">
          <div class="space-y-2">
            <div class="portal-theme-head">
              <div>
                <h2 class="portal-theme-name">${t.name}</h2>
                <p class="portal-theme-subtitle">${t.bestFor}</p>
              </div>
              ${n?`<span class="portal-theme-active">Selected</span>`:`<span class="store-business-badge">Preview</span>`}
            </div>
            <div class="portal-theme-tag-row">
              <span class="portal-theme-tag portal-theme-tag-strong">${t.bestFor}</span>
              ${(t.audience||[]).map(e=>`<span class="portal-theme-tag">${i(e)}</span>`).join(``)}
            </div>
            <p class="portal-theme-description">${t.description}</p>
          </div>
          <div class="portal-theme-actions">
            <button class="primary-button" type="button" data-use-theme="${t.key}">Use this template</button>
          </div>
          <div class="grid gap-2">
            <p class="portal-shortcut-label">Quick entry points</p>
            <div class="portal-theme-shortcuts">
              ${f(t.key,`home`)}
              ${f(t.key,`search`)}
              ${f(t.key,`category`)}
              ${f(t.key,`product`)}
              ${f(t.key,`cart`)}
            </div>
          </div>
        </div>
      </article>
    `}).join(``))}function y(e,t,n=null){let r=a(e),i=o(t),s=document.querySelector(`[data-launch-link]`),l=document.querySelector(`[data-last-link]`),u=document.querySelector(`[data-launch-summary]`),f=document.querySelector(`[data-theme-select]`);f&&(f.value=r.key),s&&(s.href=c(r.key,i.key),s.textContent=`Open ${r.name} ${i.label}`),u&&(u.textContent=`Selected: ${r.name} -> ${i.label}. ${i.helper}.`);let g=d(),y=g?.themeKey||r.key,b=g?.destinationKey||`home`;l&&(l.href=c(y,b),l.textContent=`Open last used: ${a(y).name}`),m(n),h(n,r.key),p(i.key),_(r.key),v(r.key)}function b(){let e=document.querySelector(`[data-theme-select]`);e&&!e.dataset.ready&&(e.innerHTML=n.map(e=>`<option value="${e.key}">${e.name}</option>`).join(``),e.dataset.ready=`true`)}function x(){b();let e=document.querySelector(`[data-theme-select]`),i=d(),a=n.some(e=>e.key===i?.themeKey)?i.themeKey:n[0].key,o=r.some(e=>e.key===i?.destinationKey)?i.destinationKey:`home`,c=t.some(e=>e.key===i?.businessKey)?i.businessKey:null,f=c?3:1,p=()=>{y(a,o,c),g(f,{themeKey:a,destinationKey:o,businessKey:c})};p(),e?.addEventListener(`change`,()=>{a=e.value||n[0].key,l(a,o),p()}),document.addEventListener(`click`,r=>{if(r.target.closest(`[data-wizard-next]`)instanceof HTMLButtonElement){f===1&&c?f=2:f===2&&o&&(f=3),p();return}if(r.target.closest(`[data-wizard-back]`)instanceof HTMLButtonElement){f=Math.max(1,f-1),p();return}let i=r.target.closest(`[data-business-option]`);if(i instanceof HTMLElement){c=i.dataset.businessOption||null,a=(s(c)||t[0]).recommendedTheme,u(c),l(a,o),f=1,p();return}let d=r.target.closest(`[data-destination-option]`);if(d instanceof HTMLElement){o=d.dataset.destinationOption||`home`,l(a,o),p();return}let m=r.target.closest(`[data-use-theme]`);if(m instanceof HTMLElement){a=m.dataset.useTheme||n[0].key,l(a,o),f=3,p();return}let h=r.target.closest(`a[data-theme-key][data-destination-key]`);if(h instanceof HTMLAnchorElement){l(h.dataset.themeKey||n[0].key,h.dataset.destinationKey||`home`);return}r.target.closest(`[data-launch-link]`)instanceof HTMLAnchorElement&&l(e?.value||n[0].key,o)})}window.addEventListener(`DOMContentLoaded`,x);