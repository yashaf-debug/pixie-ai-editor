/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

// A curated list of high-quality images to showcase the app's potential
const images = [
  "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/931018/pexels-photo-931018.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1528640/pexels-photo-1528640.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/2440061/pexels-photo-2440061.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg?auto=compress&cs=tinysrgb&w=600"
];

const HeroVisuals: React.FC = () => {
  return (
    <div className="hero-visuals-grid">
      {images.map((src, index) => (
        <div key={index} className="hero-visual-item">
          <img src={src} alt={`AI generated example ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
};

export default HeroVisuals;
