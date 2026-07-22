import React, { createContext, useState, useContext } from 'react';

const LikedItemsContext = createContext();

export const LikedItemsProvider = ({ children }) => {
    // The shared state for liked item IDs
    const [likedItems, setLikedItems] = useState([2, 5]);

    // Function to add or remove an item ID
    const toggleLike = (itemId) => {
        setLikedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    return (
        <LikedItemsContext.Provider value={{ likedItems, toggleLike }}>
            {children}
        </LikedItemsContext.Provider>
    );
};

export const useLikedItems = () => {
    return useContext(LikedItemsContext);
};