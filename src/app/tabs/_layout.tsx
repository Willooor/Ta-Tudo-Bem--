import { NavegacaoContext } from '@/contexts/navegacao';
import { useCallback, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import HobbiesScreen from './hobbies';
import HomeScreen from './home';
import MemoriasScreen from './memorias';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const irParaPagina = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setPaginaAtual(index);
  }, []);

  return (
    <NavegacaoContext.Provider value={{ irParaPagina }}>
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={1}
        data={[MemoriasScreen, HomeScreen, HobbiesScreen]}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item: Tela }) => (
          <View style={{ width, flex: 1 }}>
            <Tela />
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          setPaginaAtual(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        decelerationRate="fast"
        bounces={false}
      />
    </NavegacaoContext.Provider>
  );
}