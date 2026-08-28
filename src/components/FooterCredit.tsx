/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const FooterCredit: React.FC = () => {
  return (
    <footer id="app-footer-credit" className="w-full py-4 text-center select-none pointer-events-auto">
      <div className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] text-xs font-black text-[#073B4C] tracking-wide hover:shadow-[4px_4px_0px_0px_#EF476F] transition-all">
        <span>Made with <span className="text-[#EF476F]">♥</span> by ©munabbiRMushran</span>
      </div>
    </footer>
  );
};
