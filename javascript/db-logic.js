import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  increment,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function getAllBooks() {
  const querySnapshot = await getDocs(collection(db, "books"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function incrementView(bookId) {
  try {
    const bookRef = doc(db, "books", bookId);
    await updateDoc(bookRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("Gagal update views:", error);
    throw error;
  }
}

export async function addBook(bookData) {
  try {
    const docRef = await addDoc(collection(db, "books"), bookData);
    console.log("Buku berhasil ditambahkan dengan ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Gagal menambahkan buku: ", error);
    throw error;
  }
}

export async function addHistory(
  userId,
  actionType,
  detail = "",
  bookId = null
) {
  try {
    await addDoc(collection(db, "user_history"), {
      userId: userId,
      action: actionType,
      detail: detail,
      bookId: bookId,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Gagal catat riwayat: ", e);
  }
}

export async function getUserHistory(userId) {
  const q = query(
    collection(db, "user_history"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addBorrowing(
  userId,
  bookId,
  bookTitle,
  bookCover,
  deadlineStr
) {
  try {
    await addDoc(collection(db, "peminjaman"), {
      userId: userId,
      bookId: bookId,
      title: bookTitle,
      cover: bookCover || "",
      borrowDate: serverTimestamp(),
      deadline: deadlineStr,
      status: "Menunggu Pengambilan",
    });
  } catch (e) {
    console.error("Gagal mencatat peminjaman: ", e);
    throw e;
  }
}

export async function getBorrowings(userId) {
  try {
    const q = query(
      collection(db, "peminjaman"),
      where("userId", "==", userId),
      orderBy("borrowDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Gagal mengambil data peminjaman:", error);
    throw error;
  }
}

export async function updateBorrowStatus(docId, newStatus) {
  try {
    const docRef = doc(db, "peminjaman", docId);
    await updateDoc(docRef, {
      status: newStatus,
    });
  } catch (error) {
    console.error("Gagal update status:", error);
    throw error;
  }
}

export async function deleteBorrowing(docId) {
  try {
    const docRef = doc(db, "peminjaman", docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Gagal menghapus data peminjaman:", error);
    throw error;
  }
}

export async function deleteHistory(docId) {
  try {
    const docRef = doc(db, "user_history", docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Gagal menghapus riwayat:", error);
    throw error;
  }
}
 
export async function updateBookStock(bookId, changeAmount, exactStock = null) {
  try {
    const bookRef = doc(db, "books", bookId);
    
    if (exactStock !== null) {
      await updateDoc(bookRef, { stock: exactStock });
    } else {
      await updateDoc(bookRef, { stock: increment(changeAmount) });
    }
  } catch (error) {
    console.error("Gagal update stok:", error);
    throw error;
  }
}

export const getActiveBorrowCount = async (userId) => {
  try {
    const q = query(
      collection(db, "peminjaman"), 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    
    let count = 0;
    snap.forEach((doc) => {
      const status = doc.data().status;
      if (status !== "Dikembalikan" && status !== "Ditolak") {
        count++;
      }
    });
    
    return count;
  } catch (error) {
    console.error("Gagal ngecek kuota:", error);
    return 0;
  }
};