import { useNavigate } from 'react-router-dom';
import { authService } from '../fbase';
import Main from '../Main';

const Logout = () => {
    const navigate = useNavigate();
      authService.signOut();
      navigate('/');
    };

export default Logout;