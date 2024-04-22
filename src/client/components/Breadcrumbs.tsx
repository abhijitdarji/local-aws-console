import BreadcrumbGroup, { BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnFollow } from "../hooks/use-on-follow";
import { GlobalContext } from "../context/GlobalContext";

export const Breadcrumbs = () => {

    const location = useLocation();
    const basePath: BreadcrumbGroupProps.Item = {
        text: 'Home',
        href: '/'
    };
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbGroupProps.Item[]>([basePath]);
    const onFollow = useOnFollow();
    // const { environment, region } = useContext(GlobalContext);
    // const navigate = useNavigate();

    // useEffect(() => {
    //     if (!environment || !region) return;

    //     if (breadcrumbs.length > 1) {
    //         const firstPart = breadcrumbs[1].text;
    //         const secondPart = breadcrumbs[2]?.text;
    //         if (firstPart === 'cloudwatchlogs' && secondPart === 'loginsights') return;
    //         navigate(breadcrumbs[1].href);
    //     }
    // }, [environment, region]);

    useEffect(() => {
        const pathnames = location.pathname.split('/').filter((x) => x);

        if (pathnames[0] === 'favorites' && pathnames.length > 1) {
            return;
        }

        const subPaths = pathnames.map((value, index) => {
            const href = `/${pathnames.slice(0, index + 1).join('/')}${location.search}`;
            value = decodeURIComponent(value);
            if (value.length > 17) {
                value = value.substring(0, 17) + '...';
            }
            return {
                text: value,
                href: href
            };
        });

        const resourcesBreadcrumbs = [basePath, ...subPaths];

        setBreadcrumbs(resourcesBreadcrumbs);
    }, [location]);

    return <BreadcrumbGroup
        items={breadcrumbs}
        expandAriaLabel="Show path"
        ariaLabel="Breadcrumbs"
        onClick={onFollow}
    />
};