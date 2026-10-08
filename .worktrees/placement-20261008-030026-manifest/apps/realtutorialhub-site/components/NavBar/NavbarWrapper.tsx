"use client";

import { useEffect, useState } from "react";
import Navbar from "./NavBarMain";
import NavbarSkeleton from "./NavbarSkeleton";

const NavbarWrapper = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const t = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(t);
    }, []);

    return loading ? <NavbarSkeleton /> : <Navbar />;
};

export default NavbarWrapper;
