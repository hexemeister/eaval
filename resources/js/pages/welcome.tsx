// resources/js/Pages/Welcome.jsx
import { Layout } from '@/layouts/Layout';
import { SearchBar } from '@/layouts/SearchBar';
import eavalImgUrl from '../../images/eaval.png';

export default function Welcome() {
    return (
        <Layout>
            <div>
                <SearchBar/>
            </div>
	    <div>
		<img
		   src={eavalImgUrl}
		   className="w-full my-10"
		/>
	    </div>
        </Layout>
    );
}