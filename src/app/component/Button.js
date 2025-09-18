"use client";
import { motion } from "motion/react";
import React from "react";
import { IoIosReturnRight } from "react-icons/io";

const Button = (props) => {
    return (
        <div className="relative flex flex-col rounded-full  hover:cursor-pointer  px-4 py-2 min-w-40 w-fit" onClick={props.onClick}>
            <div className="absolute  top-0 left-0 bg-white  rounded-full pointer-events-auto overflow-hidden  h-[2rem] w-full">
                <motion.div
                    className="absolute top-0 left-0 z-0 w-full"
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: "-50%" }}
                >
                    <div className="box_button flex items-center justify-between px-4 py-1 min-w-40 w-fit  text-black ">
                        <span className="font-medium tex-sm">{props.title}</span>
                        <IoIosReturnRight />
                    </div>

                    <div className="box_button2 flex items-center justify-between px-4 py-2 min-w-40 w-fit  text-black  ">
                        <span className="font-medium tex-sm">{props.title}</span>
                        <IoIosReturnRight />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Button;
