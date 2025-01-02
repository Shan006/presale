import React from "react";

const Container = ({children}) => {
    return (
        <div className="bg-contain  py-10 background-image">
            {children}
        </div>
    );
}

export default Container;