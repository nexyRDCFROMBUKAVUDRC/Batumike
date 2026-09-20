// @ts-nocheck
/**
 * NNECXY - Création de média
 * Ouvre directement la galerie native du téléphone via ImagePicker.
 * Aucun affichage de galerie personnalisée ni média de démonstration.
 * Aucun enregistrement en base de données avant publication explicite.
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          router.back();
          return;
        }

        // Ouvre directement la galerie native du téléphone
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: false,
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const uris = result.assets.map((a: any) => a.uri);
          router.replace({
            pathname: '/create/editor',
            params: { uris: JSON.stringify(uris) },
          });
        } else {
          router.back();
        }
      } catch (err) {
        console.warn('Erreur ouverture galerie native:', err);
        router.back();
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
