'use client';

import Link from 'next/link';
import Navbar from './component/Navbar';
import Hero from './component/Hero';
import { Vortex } from './component/comps/Vortex';
import { FloatingDock } from './component/comps/FloatingDock ';
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconLogin,
  IconTerminal2,
  IconLogout,
} from "@tabler/icons-react";

export default function Home() {
  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },

    // {
    //   title: "Login",
    //   icon: (
    //     <IconLogin stroke={2} className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //     // <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "/login",
    // },
    // {
    //   title: "Components",
    //   icon: (
    //     <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "#",
    // },
    // {
    //   title: "Aceternity UI",
    //   icon: (
    //     <img
    //       src="https://assets.aceternity.com/logo-dark.png"
    //       width={20}
    //       height={20}
    //       alt="Aceternity Logo"
    //     />
    //   ),
    //   href: "#",
    // },
    
    // {
    //   title: "Twitter",
    //   icon: (
    //     <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "#",
    // },







    //uncomment this immedieatly 
    // {
    //   title: "GitHub",
    //   icon: (
    //     <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "https://github.com/Kishan-Solanki/InterVue-AI",
    // },
    {
      title: "Logout",
      icon: (
        <IconLogout className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        // <IconExchange className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },

  ];
  return (
    <div className="flex justify-center items-center h-screen overflow-hidden">
     
      <div className="relative w-full bg-black">
        {/* <div className="fixed h-screen w-full "> */}
         
          <div className="absolute top-0 left-0 w-full">
            <div className="w-full mx-auto rounded-md  h-screen overflow-hidden -z-20">
              <Vortex
                backgroundColor="black"
                rangeY={800}
                particleCount={500}
                baseHue={120}
                className="flex items-center flex-col justify-center px-2 md:px-10  py-4 w-full h-full -z-10"
              ></Vortex>
            </div>
          </div>
        {/* </div> */}

        <div className="relative top-0 left-0 w-full bg-transparent ">
          <Navbar />
          <Hero />
          {/* <TimelineDemo /> */}
          {/* <Team /> */}
          {/* <div className="h-screen"></div> */}
          {/* <Footer /> */}
          {/* <CanvasRevealEffectDemo /> */}
          {/* <LampDemo /> */}
          {/* <div className="h-screen"></div> */}
          {/* <div className="h-screen bg-blue-400"></div> */}
          {/* <div className="absolute bottom-[2%] flex items-center justify-center w-full z-50">
            <FloatingDock
              mobileClassName="translate-y-20" // only for demo, remove for production
              items={links}
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}
