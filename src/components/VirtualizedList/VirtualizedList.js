import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {useSelector} from 'react-redux';
import {FlatList} from 'react-native';

// Copyright (C) Slack Day Studio - All Rights Reserved
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const VirtualizedList = forwardRef((props, ref) => {
    const showAnimations = useSelector((state) => state.settings.animations);

    const listRef = useRef();

    useImperativeHandle(ref, () => ({
        scrollToTop() {
            listRef.current.scrollToOffset({offset: 0, animated: showAnimations});
        },
    }));

    return <FlatList flex={1} ref={listRef} data={[]} keyExtractor={() => 'key'} renderItem={null} ListHeaderComponent={<>{props.children}</>} {...props} />;
});
