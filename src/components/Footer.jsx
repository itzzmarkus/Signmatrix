import {Analytics} from "@vercel/analytics/react";
import Icon from "./Icon.jsx";

function Footer({version, onShowUpdateLog}) {
    return (
        <footer className="border-t border-neutral-800/80 pt-6 pb-2 mt-6 flex flex-col items-center justify-center gap-1 text-xs text-neutral-400">
            <p className="mb-0 flex items-center justify-center gap-1 flex-wrap">
                made with <Icon name="favorite" size={13} fill={true} className="text-red-400" /> by{" "}
                <a href="https://github.com/itzzmarkus" className="underline text-sky-400 hover:text-sky-300 transition-colors">itzzmarkus</a>
                <span className="text-neutral-600 mx-1">|</span>
                <a href="https://github.com/itzzmarkus/Signmatrix" className="underline text-sky-400 hover:text-sky-300 transition-colors">repo link</a>
                <span className="text-neutral-600 mx-1">|</span>
                <button
                    type="button"
                    onClick={onShowUpdateLog}
                    className="underline text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                    update log
                </button>
            </p>
            <button
                type="button"
                onClick={onShowUpdateLog}
                className="text-[11px] text-neutral-500 hover:text-neutral-300 font-mono transition-colors cursor-pointer"
                title="View update log"
            >
                Signmatrix {version}
            </button>
            <Analytics/>
        </footer>
    );
}

export default Footer;