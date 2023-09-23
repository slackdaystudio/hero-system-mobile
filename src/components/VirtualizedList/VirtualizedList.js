import React from 'react';
import {FlatList} from 'react-native';

export const VirtualizedList = ({children}) => {
    return <FlatList data={[]} keyExtractor={() => 'key'} renderItem={null} ListHeaderComponent={<>{children}</>} />;
};
