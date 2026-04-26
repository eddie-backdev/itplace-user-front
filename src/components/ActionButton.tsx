import React from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  size?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  onClick,
  variant = 'primary',
  size = 50,
}) => {
  const baseClasses =
    'flex items-center justify-center border border-gray-300 rounded-[12px] transition-colors duration-200';

  const variantClasses = {
    primary: 'bg-purple04 hover:bg-purple05 text-white',
    secondary: 'bg-grey01 hover:bg-grey02 text-grey06',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02`}
      style={{ width: size, height: size }}
    >
      {icon}
    </button>
  );
};

export default ActionButton;
