
import Link from 'next/link';
import React from 'react';

export function FuturisticButton() {
  return (
    <Link href="/playground" passHref>
      <button className="futuristic-button">
        P L A Y
        <div id="clip">
          <div id="leftTop" className="corner"></div>
          <div id="rightBottom" className="corner"></div>
          <div id="rightTop" className="corner"></div>
          <div id="leftBottom" className="corner"></div>
        </div>
        <span id="rightArrow" className="arrow"></span>
        <span id="leftArrow" className="arrow"></span>
      </button>
    </Link>
  );
}
