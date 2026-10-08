import { useAuth } from "@/components/contexts/AuthProvider";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// 1. 타입 정의
export interface Address {
  id: number;
  name: string;
  recipient: string;
  phone: string; // 하이픈 없는 순수 숫자 형태로 관리
  postalCode: string;
  address: string;
  detailAddress: string;
  isDefault: boolean;
}

// 3. Context 상태 타입 정의
interface AddressContextType {
  addresses: Address[];
  addOrUpdateAddress: (address: Omit<Address, "id"> & { id?: number }) => void;
  deleteAddress: (id: number) => void;
  setDefaultAddress: (id: number) => void;
  getAddressById: (id: number) => Address | undefined;
}

// 4. Context 생성
const AddressContext = createContext<AddressContextType | undefined>(undefined);

// 5. Context Provider 컴포넌트
interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  // 처음에는 빈 목록 (예시 주소 없음). 사용자가 직접 추가한 배송지만 보여요.
  const [addresses, setAddresses] = useState<Address[]>([]);

  // 로그아웃하면 배송지 목록을 비워서 다음 사람에게 보이지 않게 해요.
  useEffect(() => {
    if (!isAuthenticated) setAddresses([]);
  }, [isAuthenticated]);

  // 주소 ID로 조회
  const getAddressById = useCallback(
    (id: number): Address | undefined => {
      return addresses.find((addr) => addr.id === id);
    },
    [addresses],
  );

  // 주소 추가 또는 수정
  const addOrUpdateAddress = useCallback(
    (newAddressData: Omit<Address, "id"> & { id?: number }) => {
      setAddresses((prevAddresses) => {
        let updatedAddresses: Address[];
        const isUpdating =
          newAddressData.id !== undefined && newAddressData.id !== 0;
        const finalId = isUpdating ? newAddressData.id! : Date.now();

        const fullAddress: Address = {
          ...newAddressData,
          id: finalId,
          isDefault: newAddressData.isDefault,
        } as Address;

        if (isUpdating) {
          // 수정
          updatedAddresses = prevAddresses.map((addr) =>
            addr.id === finalId ? fullAddress : addr,
          );
        } else {
          // 추가
          updatedAddresses = [fullAddress, ...prevAddresses];
        }

        // 기본 배송지 설정 처리
        if (fullAddress.isDefault) {
          updatedAddresses = updatedAddresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === finalId,
          }));
        }

        return updatedAddresses;
      });
    },
    [],
  );

  // 주소 삭제
  const deleteAddress = useCallback((id: number) => {
    setAddresses((prevAddresses) => {
      let newAddresses = prevAddresses.filter((addr) => addr.id !== id);
      const wasDefault = prevAddresses.find(
        (addr) => addr.id === id,
      )?.isDefault;

      // 삭제된 주소가 기본이었으면, 남은 주소 중 첫 번째를 기본으로 설정
      if (wasDefault && newAddresses.length > 0) {
        newAddresses = newAddresses.map((addr, index) =>
          index === 0 ? { ...addr, isDefault: true } : addr,
        );
      }
      return newAddresses;
    });
  }, []);

  // 기본 주소 설정
  const setDefaultAddress = useCallback((id: number) => {
    setAddresses((prevAddresses) => {
      return prevAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }));
    });
  }, []);

  return (
    <AddressContext.Provider
      value={{
        addresses,
        addOrUpdateAddress,
        deleteAddress,
        setDefaultAddress,
        getAddressById,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

// 6. Context 사용을 위한 커스텀 훅
export const useAddressManage = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddressManage must be used within an AddressProvider");
  }
  return context;
};
