import React from "react";

//
// SVG Jira ikonka
//

export default function IconJira(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width="1.5em"
      height="1.5em"
      {...props}
    >
      <defs>
        <linearGradient
          id="grad1"
          x1="41.59"
          y1="57.47"
          x2="54.39"
          y2="44.67"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0052cc" />
          <stop offset="1" stopColor="#2684ff" />
        </linearGradient>
        <linearGradient
          id="grad2"
          x1="31.83"
          y1="18.17"
          x2="19"
          y2="30.99"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0052cc" />
          <stop offset="1" stopColor="#2684ff" />
        </linearGradient>
      </defs>
      <path
        d="M113.65 56.13 62.47 4.96 57.51 0 1.38 56.13a4.71 4.71 0 0 0 0 6.66l35.2 35.2 20.94 20.94 56.14-56.14a4.71 4.71 0 0 0 0-6.66ZM57.51 77.04 39.93 59.46 57.51 41.88l17.58 17.58-17.58 17.58Z"
        fill="#2684ff"
      />
      <path
        d="M57.51 41.88C46 30.37 45.94 11.72 57.39.14L18.91 38.6l20.94 20.94L57.51 41.88Z"
        fill="url(#grad2)"
      />
      <path
        d="M75.14 59.41 57.51 77.04c5.56 5.55 8.68 13.09 8.68 20.94s-3.12 15.39-8.68 20.94l38.57-38.57L75.14 59.41Z"
        fill="url(#grad1)"
      />
    </svg>
  );
}
