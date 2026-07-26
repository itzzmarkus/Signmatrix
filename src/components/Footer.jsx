import {Analytics} from "@vercel/analytics/react";

function Footer({version}) {
    return (
        <>
            <p className="mb-0">made with ♥︎ by <a href="https://github.com/itzzmarkus"
                                                   className="underline text-sky-400">itzzmarkus</a> | <a
                href="https://github.com/itzzmarkus/Signmatrix" className="underline text-sky-400">repo link</a></p>
            <p>Signmatrix {version}</p>
            <Analytics/>
        </>
    );
}

export default Footer;