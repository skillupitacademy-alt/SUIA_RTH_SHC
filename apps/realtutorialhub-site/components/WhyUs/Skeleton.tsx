interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

export const Skeleton = ({
  width = "w-full",
  height = "h-4",
  radius = "rounded",
  className = ""
}: SkeletonProps) => {
  return (
    <div
      className={`
        bg-gray-300 animate-pulse
        ${width} ${height} ${radius}
        ${className}
      `}
    />
  );
};
