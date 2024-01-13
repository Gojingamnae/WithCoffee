import React, { useState, useEffect,useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, dbService } from '../fbase';
import { doc,  getDoc, getDocs,  updateDoc,  arrayUnion,  collection,  addDoc,
  query,  orderBy,  onSnapshot, where, deleteDoc} from 'firebase/firestore';

const PostDetail = () => {
  const navigate = useNavigate();
  const { category, postId } = useParams();
  const [post, setPost] = useState({
    scraps: [],
    commentid: [],
  });
  const [userLiked, setUserLiked] = useState(false);
  const [userScrapped, setUserScrapped] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [writerNickname, setWriterNickname] = useState('');
  const user = authService.currentUser;
  const createrId = user?.uid; // Add a conditional check
  const commentInputRef = useRef(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDocRef = doc(dbService, 'posts', postId);
        const postDocSnapshot = await getDoc(postDocRef);
    
        if (postDocSnapshot.exists()) {
          const postData = postDocSnapshot.data();  
          setPost({ id: postDocSnapshot.id, ...postData });
          setUserLiked(postData.likes?.includes(createrId));
          setUserScrapped(postData.scraps?.includes(createrId));
        } else {
          console.error('Post not found with ID:', postId);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };    

    const fetchComments = async () => {
      try {
        const commentsCollection = collection(dbService, 'comments');
        const postCommentsQuery = query(
          commentsCollection,
          where('postid', '==', postId),
          orderBy('time')
        );
    
        const querySnapshot = await getDocs(postCommentsQuery);
    
        const fetchedComments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
    
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    const fetchUserData = async () => {
      if (user) {
        try {
          const userQuery = query(collection(dbService, 'User'), where('createrId', '==', user.uid));
          const querySnapshot = await getDocs(userQuery);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const nickname = userDoc.data().nickname;
            setWriterNickname(nickname);
          } else {
            console.error("User document not found for createrId:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };    
    fetchPost();
    fetchComments();
    fetchUserData();
  }, [postId, createrId, user]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
  
    if (newComment.trim() === '') {
      return;
    }
  
    try {
      const commentData = {
        postid: postId,
        postClass: post.Class,
        createrId: createrId,
        text: newComment,
        time: Date.now(),
        Writer: writerNickname,
      };
  
      const commentDocRef = await addDoc(collection(dbService, 'comments'), commentData);
  
      // Update the posts collection's commentid array
      const postDocRef = doc(dbService, 'posts', postId);
      await updateDoc(postDocRef, {
        commentid: arrayUnion(commentDocRef.id),
      });
  
      setComments((prevComments) => [
        ...prevComments,
        { id: commentDocRef.id, ...commentData },
      ]);
  
      // Increment the comment count in the UI
      setPost((prevPost) => ({
        ...prevPost,
        commentid: [...prevPost.commentid, commentDocRef.id],
      }));
  
      setNewComment('');
      commentInputRef.current.value = ''; // Clear the input field
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const handleDelete = async () => {
    try {
      // Add logic to check if the user is the post creator and has the permission to delete
      const postDocRef = doc(dbService, 'posts', postId);
      await deleteDoc(postDocRef);
      alert('게시글이 삭제되었습니다!');
      navigate('/community/popular'); // Navigate to the desired route
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };
  const handleLikeClick = async () => {
    try {
      if (!userLiked) {
        const postDocRef = doc(dbService, 'posts', postId);
        await updateDoc(postDocRef, {
          like: post.like + 1,
          likes: arrayUnion(createrId),
        });

        setPost((prevPost) => ({
          ...prevPost,
          like: prevPost.like + 1,
          likes: prevPost.likes ? [...prevPost.likes, createrId] : [createrId],
        }));
        setUserLiked(true);
      }
    } catch (error) {
      console.error('Error updating like count:', error);
    }
  };

  const handleScrapClick = async () => {
    try {
      if (!userScrapped) {
        const postDocRef = doc(dbService, 'posts', postId);
        await updateDoc(postDocRef, {
          scrap: post.scrap + 1,
          scraps: arrayUnion(createrId),
        });

        setPost((prevPost) => ({
          ...prevPost,
          scrap: prevPost.scrap + 1,
          scraps: prevPost.scraps ? [...prevPost.scraps, createrId] : [createrId],
        }));
        setUserScrapped(true);
      }
    } catch (error) {
      console.error('Error updating scrap count:', error);
    }
  };
  const handleEditClick = () => {
    // Assuming you've set up a route for the edit page with a path like '/edit/:postId'
    navigate(`/Edit/${postId}`);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const commentDocRef = doc(dbService, 'comments', commentId);
      await deleteDoc(commentDocRef);

      // Update the posts collection's commentid array after deleting the comment
      const postDocRef = doc(dbService, 'posts', postId);
      await updateDoc(postDocRef, {
        commentid: post.commentid.filter((id) => id !== commentId),
      });

      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));

      // Decrement the comment count in the UI
      setPost((prevPost) => ({
        ...prevPost,
        commentid: prevPost.commentid.filter((id) => id !== commentId),
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };


  return (
    <div>
      {post ? (
        <div>
          <h2>{post.PostTitle}</h2>
          {post.createrId === createrId && (
            <button onClick={handleDelete}>삭제</button>
            )}
            {post.createrId === createrId && (
            <button onClick={handleEditClick}>수정</button>
          )}
          <p> 시간 : {new Date(post.time).toLocaleString()}</p>
          <p> 작성자 : {post.Writer}</p>
          <p> {post.PostText}</p>
          {post.PostImgs && post.PostImgs.length > 0 && (
  <div>
    {post.PostImgs.map((imageUrl, index) => (
      <img key={index} src={imageUrl} alt={`postimg-${index}`} />
    ))}
  </div>
)}

          <p> {post.like}</p>
          <button onClick={handleLikeClick} style={{ backgroundColor:'#ffffff', border: '#ffffff', textAlign:'center'}}> ❤️ </button>
          <p> {post.scrap}</p>
          <button onClick={handleScrapClick} style={{ backgroundColor:'#ffffff', border: '#ffffff', textAlign:'center'}}> ✅</button>
          <p> 댓글 수: {post.commentid ? post.commentid.length : 0}</p>
          <ul>
            {comments.map((comment) => (
              <li key={comment.id}>
                <p>{comment.text}</p>
                <p>Time: {new Date(comment.time).toLocaleString()}</p>
                {comment.createrId === createrId && (
                  <button onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 적어주세요!"
            />
            <button type="submit">저장</button>
          </form>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default PostDetail;