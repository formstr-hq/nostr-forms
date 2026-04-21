import React from "react";
import { Carousel, Card, Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "styled-components";

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  .ant-carousel {
    margin: 0 auto;
    width: 100%;
  }
`;

const Controls = styled.div`
  position: absolute;
  top: 40%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  z-index: 10;
  button {
    background: rgba(255, 255, 255, 0.8);
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
`;

const SelectableCard = styled(Card)<{ $selected?: boolean }>`
  cursor: pointer;
  border: ${(props) =>
    props.$selected ? "2px solid var(--app-color-info)" : "2px solid transparent"};
  transition: border 0.2s ease;
  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 6px;
  }
`;

interface ImagePickerProps {
  options: string[];
  selectedUrl?: string;
  onSelect: (url: string) => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  options,
  selectedUrl,
  onSelect,
}) => {
  const carouselRef = React.useRef<any>(null);

  // break images into groups depending on screen size
  const chunkSize = window.innerWidth > 768 ? 5 : 3;
  const slides: string[][] = [];
  for (let i = 0; i < options.length; i += chunkSize) {
    slides.push(options.slice(i, i + chunkSize));
  }

  return (
    <CarouselWrapper>
      <Controls>
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          onClick={() => carouselRef.current?.prev()}
        />
        <Button
          shape="circle"
          icon={<RightOutlined />}
          onClick={() => carouselRef.current?.next()}
        />
      </Controls>

      <Carousel ref={carouselRef} dots={false}>
        {slides.map((group, idx) => (
          <div
            key={idx}
            style={{ display: "flex", gap: "12px", padding: "8px" }}
          >
            {group.map((url) => (
              <SelectableCard
                key={url}
                hoverable
                cover={<img alt="background option" src={url} />}
                $selected={url === selectedUrl}
                onClick={() => onSelect(url)}
              />
            ))}
          </div>
        ))}
      </Carousel>
    </CarouselWrapper>
  );
};
