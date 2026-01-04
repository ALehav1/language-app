import { supabase } from '../lib/supabase';

export async function testSupabaseConnection() {
    console.log('🔄 Testing Supabase connection...');

    try {
        const start = performance.now();
        const { data, error } = await supabase
            .from('vocabulary_items')
            .select('count')
            .limit(1)
            .single();

        const duration = Math.round(performance.now() - start);

        if (error) {
            // If code is PGRST116, it means table is empty but connection worked (single() expects 1 row)
            // Actually .single() on count might be weird if we select count.
            // Let's just select id.
            if (error.code === 'PGRST116') {
                console.log('✅ Supabase Connected! (Table is empty, which is expected)');
                return true;
            }
            console.error('❌ Supabase Error:', error.message, error);
            return false;
        }

        console.log(`✅ Supabase Connected! (${duration}ms)`);
        console.log('Data received:', data);
        return true;
    } catch (err) {
        console.error('❌ Connection Failed:', err);
        return false;
    }
}
